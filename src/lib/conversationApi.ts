import { DELTA_API_URL, fetchWithRetry } from "./api";

export type ConversationTurnRequest = {
  userId: string;
  message: string;
};

export type ConversationTurnResponse = {
  session_id: string;
  user_id: string;
  input_mode: string;
  message: string;
  response: string;
  intent: string;
  read_only: boolean;
  memory_writes: boolean;
  notification: boolean;
  tts: boolean;
  side_effect_status: string;
  state_source: string;
  metadata: Record<string, unknown>;
  context_summary: Record<string, unknown>;
};

export async function askDeltaConversation({
  userId,
  message,
}: ConversationTurnRequest): Promise<ConversationTurnResponse> {
  const response = await fetchWithRetry(
    `${DELTA_API_URL}/conversation/turn`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        message,
        read_only: true,
      }),
    },
    0,
    10000,
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof payload.error === "string" ? payload.error : "Conversation backend unavailable";
    throw new Error(detail);
  }
  return payload as ConversationTurnResponse;
}
