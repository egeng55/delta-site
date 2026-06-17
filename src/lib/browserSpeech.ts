export type BrowserSpeechStatus =
  | "unavailable"
  | "idle"
  | "speaking"
  | "finished"
  | "cancelled"
  | "failed";

export type BrowserSpeechControls = {
  available: boolean;
  speak: (
    text: string,
    handlers?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
    },
  ) => BrowserSpeechStatus;
  cancel: () => BrowserSpeechStatus;
};

export function createBrowserSpeechControls(): BrowserSpeechControls {
  if (typeof window === "undefined" || !window.speechSynthesis || typeof window.SpeechSynthesisUtterance === "undefined") {
    return {
      available: false,
      speak: () => "unavailable",
      cancel: () => "unavailable",
    };
  }

  return {
    available: true,
    speak: (text, handlers) => {
      const cleanText = text.trim();
      if (!cleanText) return "failed";
      try {
        window.speechSynthesis.cancel();
        const utterance = new window.SpeechSynthesisUtterance(cleanText);
        utterance.onstart = () => handlers?.onStart?.();
        utterance.onend = () => handlers?.onEnd?.();
        utterance.onerror = () => handlers?.onError?.();
        window.speechSynthesis.speak(utterance);
        return "speaking";
      } catch {
        return "failed";
      }
    },
    cancel: () => {
      try {
        window.speechSynthesis.cancel();
        return "cancelled";
      } catch {
        return "failed";
      }
    },
  };
}
