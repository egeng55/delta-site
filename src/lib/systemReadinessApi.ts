import { DELTA_API_URL, fetchWithRetry } from "./api";

export type ReadinessStatus = "ready" | "unavailable" | "not_checked" | "terminal_only" | "not_built" | "fallback";

export type SystemReadinessResponse = {
  backend: {
    reachable: boolean;
    status: string;
    service?: string;
  };
  supabase: {
    configured: boolean;
    reachable: boolean;
    status: string;
    schema_status: string;
    reason?: string;
    tables?: Record<string, { readable?: boolean; status?: string }>;
  };
  conversation: {
    api_available: boolean;
    read_only: boolean;
    input_mode: string;
    tts: boolean;
    notification: boolean;
    live_mic: boolean;
    memory_writes: boolean;
  };
  proof_user: {
    user_id: string;
    state_readable: boolean;
    state_source?: string;
    last_outcome?: string | null;
    cooldown_minutes?: number | null;
    tone?: string | null;
    success_rate?: number | null;
    reason?: string;
  };
  local_runtime: {
    mic_check_available: boolean;
    mic_check_status: string;
    tts_check_available: boolean;
    tts_check_status: string;
    notification_check_available: boolean;
    notification_check_status: string;
    tts_enabled_effective: boolean;
    desktop_notifications_enabled_effective: boolean;
    live_mic_from_web: boolean;
    browser_tts_from_web: boolean;
    always_on: boolean;
    wake_word: boolean;
  };
  status_json: {
    available: boolean;
    freshness: string;
    path: string;
    status_age_seconds?: number | null;
    updated_at?: string | null;
  };
  safety: {
    side_effects_default: string;
    memory_writes_default: string;
    requires_explicit_confirmation: boolean;
    low_quality_audio_gated: boolean;
    web_voice_controls_enabled: boolean;
  };
  generated_at: string;
};

export async function getSystemReadiness(): Promise<SystemReadinessResponse> {
  const response = await fetchWithRetry(`${DELTA_API_URL}/system/readiness`, {}, 0, 10000);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof payload.error === "string" ? payload.error : "System readiness unavailable";
    throw new Error(detail);
  }
  return payload as SystemReadinessResponse;
}
