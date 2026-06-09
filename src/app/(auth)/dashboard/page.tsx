"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DELTA_API_URL, fetchWithRetry } from "@/lib/api";
import { FEEDBACK_CONTRACT } from "@/lib/feedbackContract";
import { DEMO_SCENARIO_FIXTURES } from "@/lib/demoFixtures";

type EventRow = {
  id?: string;
  event_type?: string;
  timestamp?: string;
  raw_text?: string;
  audio_classification?: string;
  details?: Record<string, unknown>;
  importance?: number;
  urgency?: number;
  should_store?: boolean;
  source?: string;
  confidence?: number;
  speaker?: string;
  user_id?: string;
};

type MemoryWrite = {
  id?: string;
  memory_type?: string;
  content?: string;
  source_event_type?: string;
  confidence?: number;
  created_at?: string;
};

type Intervention = {
  id?: string;
  intervention_id?: string;
  action?: string;
  channel?: string;
  style?: string;
  message?: string | null;
  reasoning?: string;
  event_type?: string;
  domain?: string | null;
  context?: Record<string, unknown>;
  should_intervene?: boolean;
  feedback_outcome?: string | null;
  delivery_status?: string | null;
  delivery_method?: string | null;
  delivered_at?: string | null;
  user_response?: string | null;
  outcome_score?: number | null;
  evaluation_label?: string | null;
  receptiveness_score?: number | null;
  cooldown_until?: string | null;
  adaptation_applied?: Record<string, unknown>;
  decision_explanation?: string[];
  intervention_copy?: string | null;
  adaptation_summary?: string[];
  side_effect_status?: string;
  created_at?: string;
};

type FeedbackStats = {
  total?: number;
  success_rate?: number | null;
  by_event_type?: Record<string, { total: number; success: number; rejected: number }>;
  by_time_bucket?: Record<string, { total: number; success: number; rejected: number }>;
  timing_guidance?: Array<{ scope: string; value: string; recommendation: string; reason: string }>;
};

type RuntimeStatus = {
  run_id?: string;
  user_id?: string;
  mode?: string;
  scenario?: string;
  started_at?: string;
  completed_at?: string | null;
  final_status?: string;
  side_effects_enabled?: boolean;
  status_log_path?: string;
  dashboard_url?: string;
  dashboard_available?: boolean;
  backend_available?: boolean;
  mic_state?: string;
  pipeline_stage?: string;
  current_stage?: string;
  final_result?: string;
  feedback?: string | null;
  feedback_submitted?: string | null;
  feedback_contract?: typeof FEEDBACK_CONTRACT;
  demo_mode?: "simulator" | "live" | string;
  is_listening?: boolean;
  speech_detected?: boolean;
  last_audio_window?: Record<string, unknown> | null;
  latest_transcript?: string | null;
  last_transcript?: string | null;
  extracted_events?: EventRow[];
  decision?: Intervention | null;
  decision_explanation?: string[];
  intervention_copy?: string | null;
  delivery_status?: string | null;
  adaptation_summary?: string[];
  learned_state_before?: Record<string, unknown> | null;
  learned_state_after?: Record<string, unknown> | null;
  errors?: string[];
  warnings?: string[];
  input_source?: string;
  transcription_status?: string;
  audio_source?: string;
  audio_diagnostics?: Record<string, unknown> | null;
  state_source?: string;
  state_persistence?: string;
  state_is_simulated?: boolean;
  state_provenance?: StateProvenance;
  persisted_state_status?: PersistedStateStatus;
  late_caffeine_state?: BehavioralLoopState | null;
  last_detected_event?: EventRow | null;
  last_intervention_decision?: Intervention | null;
  error_state?: string | null;
  runner_config?: Record<string, unknown> | null;
  preflight_checks?: Array<{ name?: string; status?: string; explanation?: string; side_effect_status?: string }>;
  pipeline_log?: Array<{
    timestamp?: string;
    at?: string;
    stage?: string;
    status?: string;
    explanation?: string;
    detail?: string;
    side_effect_status?: string;
    decision_explanation?: string[];
    adaptation_summary?: string[];
    intervention_copy?: string;
  }>;
  stages?: Array<{
    timestamp?: string;
    at?: string;
    stage?: string;
    status?: string;
    explanation?: string;
    detail?: string;
    side_effect_status?: string;
    decision_explanation?: string[];
    adaptation_summary?: string[];
    intervention_copy?: string;
  }>;
  behavioral_loop?: Record<string, BehavioralLoopState>;
  product_demo_summary?: ProductDemoSummary;
  status_age_seconds?: number | null;
  updated_at?: string;
};

type ProductDemoScenario = {
  scenario?: string;
  mode?: string;
  product_point?: string;
  proof_key?: string;
  passed?: boolean;
  status?: string;
  transcript?: string | null;
  input_source?: string;
  transcription_status?: string;
  event?: string;
  decision?: string;
  delivery_status?: string;
  feedback?: string;
  adaptation?: string;
  dashboard_url?: string;
  status_json_path?: string;
};

type ProductDemoSummary = {
  type?: string;
  run_id?: string;
  user_id?: string;
  mode?: string;
  started_at?: string;
  completed_at?: string;
  scenarios?: ProductDemoScenario[];
  scenarios_run?: number;
  scenarios_passed?: number;
  scenarios_failed?: number;
  proof_points?: Record<string, boolean>;
  dashboard_url?: string;
  status_json_path?: string;
  state_provenance?: {
    persistence?: string;
    is_simulated?: boolean;
    source?: string;
  };
  remaining_unproven_items?: string[];
  final_demo_readiness_status?: string;
};

type StateProvenance = {
  source?: string;
  persistence?: string;
  is_simulated?: boolean;
  freshness?: string;
  status_age_seconds?: number | null;
  warnings?: string[];
};

type PersistedStateStatus = {
  status?: string;
  source?: string;
  reason?: string;
};

type BehavioralLoopMetrics = {
  interventions_delivered?: number;
  interventions_accepted?: number;
  interventions_ignored?: number;
  interventions_annoying?: number;
  feedback_count?: number;
  success_rate?: number | null;
  current_receptiveness_score?: number;
  current_cooldown_until?: string | null;
  last_outcome?: string | null;
};

type LearnedAdaptation = {
  type?: string;
  value?: unknown;
  reason?: string;
};

type BehavioralLoopState = {
  domain?: string;
  state_source?: string;
  state_persistence?: string;
  state_is_simulated?: boolean;
  adaptation?: Record<string, unknown>;
  metrics?: BehavioralLoopMetrics;
  learned_adaptations?: LearnedAdaptation[];
  receptiveness_score?: number;
  current_cooldown_until?: string | null;
  last_outcome?: string | null;
};

type BehavioralDashboard = {
  user_id: string;
  live_audio_state?: {
    status?: string;
    classification?: string;
    latest_transcript?: string | null;
    raw_audio_retained?: boolean;
    speaker?: string;
    observation_count?: number;
  };
  recent_events?: EventRow[];
  memory_writes?: MemoryWrite[];
  interventions?: Intervention[];
  feedback_learning?: FeedbackStats;
  behavioral_preferences?: Record<string, unknown>;
  behavioral_loop?: Record<string, BehavioralLoopState>;
  runtime_status?: RuntimeStatus;
  system_status?: Record<string, string>;
};

type BedroomStatusResponse = {
  user_id?: string;
  error?: string;
  detail?: string;
  runtime_status?: RuntimeStatus | null;
  late_caffeine_state?: BehavioralLoopState | null;
  status_snapshot_late_caffeine_state?: BehavioralLoopState | null;
  state_provenance?: StateProvenance;
  status_snapshot_state_provenance?: StateProvenance;
  persisted_state_status?: PersistedStateStatus;
  recent_events?: EventRow[];
  recent_interventions?: Intervention[];
};

const samplePrompts = [
  "I drank a Monster at 10 PM.",
  "I had coffee around 8 PM.",
  "I just drank an energy drink at 9:30 PM.",
  "I took pre-workout at 7 PM.",
];

const LOCAL_DEMO_BACKEND_UNAVAILABLE = "Local demo backend unavailable";

const productDemoCommand = "cd /Users/egeng/delta-backend && .venv/bin/python -m late_caffeine_demo --user-id eric-demo --product-demo --dry-run --dashboard-url 'http://127.0.0.1:3000/dashboard?localDemo=1' --no-start-backend --no-start-dashboard";

const pipelineStageDefinitions = [
  { label: "Preflight", aliases: ["Running preflight checks", "preflight"] },
  { label: "Audio/Input", aliases: ["Processing audio window"] },
  { label: "Speech Detection", aliases: ["Detecting speech", "speech_detected"] },
  { label: "Transcription", aliases: ["Transcribing observation"] },
  { label: "Event Extraction", aliases: ["Extracting behavioral event"] },
  { label: "Memory Context", aliases: ["Building memory context"] },
  { label: "Intervention Decision", aliases: ["Evaluating intervention policy"] },
  { label: "Delivery", aliases: ["Delivering or simulating intervention"] },
  { label: "Feedback", aliases: ["Recording feedback"] },
  { label: "Adaptation", aliases: ["Updating future behavior"] },
  { label: "Demo Complete", aliases: ["Demo complete"] },
];

function Icon({ name, className = "h-4 w-4" }: { name: "activity" | "brain" | "bell" | "database" | "send" | "check" | "x" | "clock"; className?: string }) {
  const common = { className, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 };
  if (name === "activity") {
    return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4l3 8 4-16 3 8h4" /></svg>;
  }
  if (name === "brain") {
    return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7a3 3 0 0 1 6 0v10a3 3 0 0 1-6 0V7Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M14 8a3 3 0 0 1 3-3 3 3 0 0 1 0 6 3 3 0 0 1 0 6 3 3 0 0 1-3-3" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 8A3 3 0 0 0 5 5a3 3 0 0 0 0 6 3 3 0 0 0 0 6 3 3 0 0 0 3-3" /></svg>;
  }
  if (name === "bell") {
    return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M10 21h4" /></svg>;
  }
  if (name === "database") {
    return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></svg>;
  }
  if (name === "send") {
    return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="m3 3 19 9-19 9 4-9-4-9Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 12h15" /></svg>;
  }
  if (name === "check") {
    return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="m5 12 5 5L20 7" /></svg>;
  }
  if (name === "x") {
    return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" /></svg>;
  }
  return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /><circle cx="12" cy="12" r="9" /></svg>;
}

function formatTime(value?: string) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function scoreLabel(value?: number) {
  if (value === undefined || value === null) return "0.00";
  return value.toFixed(2);
}

function feedbackEvaluation(outcome: string) {
  if (outcome === "good_call") return { label: "useful", score: 1 };
  if (outcome === "remind_earlier" || outcome === "remind_later") return { label: "timing_change", score: 0.55 };
  if (outcome === "wrong_timing") return { label: "wrong_timing", score: 0.45 };
  if (outcome === "misunderstood") return { label: "misunderstood", score: 0.1 };
  if (outcome === "dont_mention_again") return { label: "suppressed", score: 0 };
  if (outcome === "too_much") return { label: "annoying", score: 0 };
  return { label: "not_useful", score: 0 };
}

function compactValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "unknown";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(3);
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function stringList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return [];
}

function formatStatusAge(value?: number | null) {
  if (value === undefined || value === null) return "unknown";
  if (value < 60) return `${value}s ago`;
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}m ${seconds}s ago`;
}

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function findPipelineStage(
  entries: RuntimeStatus["pipeline_log"],
  aliases: string[],
) {
  const normalized = entries || [];
  return normalized.find((entry) => {
    const stage = String(entry.stage || "");
    return aliases.some((alias) => stage === alias || stage.startsWith(`${alias}.`) || stage.includes(alias));
  });
}

function adaptationDiff(before: unknown, after: unknown) {
  const beforeAdaptation = objectRecord(objectRecord(before).adaptation);
  const afterAdaptation = objectRecord(objectRecord(after).adaptation);
  const keys = Array.from(new Set([...Object.keys(beforeAdaptation), ...Object.keys(afterAdaptation)]))
    .filter((key) => key !== "learned_rules" && key !== "last_feedback_summary");
  return keys
    .map((key) => ({ key, before: beforeAdaptation[key], after: afterAdaptation[key] }))
    .filter((item) => compactValue(item.before) !== compactValue(item.after));
}

function Panel({ title, icon, children }: { title: string; icon: "activity" | "brain" | "bell" | "database" | "clock" | "send" | "check"; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon name={icon} />
        </span>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, session, access, isLoading, logout } = useAuth();
  const [dashboard, setDashboard] = useState<BehavioralDashboard | null>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus | null>(null);
  const [transcript, setTranscript] = useState(samplePrompts[0]);
  const [audioClass, setAudioClass] = useState("user_speech");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const localDemoAllowed = process.env.NEXT_PUBLIC_DELTA_LOCAL_DEMO === "true";
  const isLocalDemo = localDemoAllowed && searchParams.get("localDemo") === "1";
  const localDemoUserId = isLocalDemo ? searchParams.get("userId") || "eric-demo" : null;
  const activeUser = useMemo(() => {
    if (user) return user;
    if (!isLocalDemo) return null;
    return {
      id: localDemoUserId || "eric-demo",
      email: "local-demo@delta.dev",
      name: "Local Demo",
      username: "local-demo",
      role: "developer" as const,
    };
  }, [user, isLocalDemo, localDemoUserId]);
  const hasDashboardAccess = Boolean(access?.hasPremiumAccess || isLocalDemo);

  useEffect(() => {
    if (!isLoading && !isLocalDemo) {
      if (!user) {
        router.push("/login");
      } else if (!access?.hasPremiumAccess) {
        router.push("/pricing");
      }
    }
  }, [user, access, isLoading, router, isLocalDemo]);

  const authHeaders = useMemo(() => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    return headers;
  }, [session?.access_token]);

  const fetchLocalDemoStatus = useCallback(async () => {
    if (!activeUser) throw new Error(LOCAL_DEMO_BACKEND_UNAVAILABLE);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 2500);
    try {
      const response = await fetch(`${DELTA_API_URL}/bedroom-copilot/${activeUser.id}/status`, {
        headers: authHeaders,
        signal: controller.signal,
      });
      return response;
    } catch {
      throw new Error(LOCAL_DEMO_BACKEND_UNAVAILABLE);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, [activeUser, authHeaders]);

  const buildLocalDemoDashboard = useCallback((status: RuntimeStatus | null, backendAvailable: boolean, response?: BedroomStatusResponse): BehavioralDashboard => ({
    user_id: activeUser?.id || "eric-demo",
    live_audio_state: {
      status: status?.pipeline_stage || (backendAvailable ? "idle" : "backend_unavailable"),
      classification: status?.last_audio_window?.classification as string | undefined,
      latest_transcript: status?.latest_transcript || status?.last_transcript || null,
      raw_audio_retained: Boolean(status?.last_audio_window?.raw_audio_retained),
      speaker: status ? "user" : undefined,
      observation_count: status?.extracted_events?.length || (status?.last_detected_event ? 1 : 0),
    },
    recent_events: response?.recent_events || status?.extracted_events || (status?.last_detected_event ? [status.last_detected_event] : []),
    memory_writes: [],
    interventions: response?.recent_interventions || (status?.decision ? [status.decision] : status?.last_intervention_decision ? [status.last_intervention_decision] : []),
    feedback_learning: undefined,
    behavioral_loop: response?.late_caffeine_state
      ? { ...(status?.behavioral_loop || {}), late_caffeine: response.late_caffeine_state }
      : status?.behavioral_loop,
    runtime_status: status || {
      user_id: activeUser?.id || "eric-demo",
      mode: "dry-run",
      demo_mode: "dry-run",
      pipeline_stage: "backend_unavailable",
      current_stage: "backend_unavailable",
      final_status: "unavailable",
      side_effects_enabled: false,
      dashboard_available: true,
      backend_available: false,
      mic_state: "unknown",
      is_listening: false,
      speech_detected: false,
      latest_transcript: null,
      extracted_events: [],
      decision: null,
      decision_explanation: [],
      intervention_copy: null,
      delivery_status: "skipped",
      adaptation_summary: [],
      errors: [LOCAL_DEMO_BACKEND_UNAVAILABLE],
      warnings: ["Start the local backend to load Bedroom Copilot demo status."],
      error_state: LOCAL_DEMO_BACKEND_UNAVAILABLE,
      runner_config: {
        backend_url: DELTA_API_URL,
        dashboard_url: "http://127.0.0.1:3000/dashboard?localDemo=1",
        dry_run: true,
        side_effects_enabled: false,
      },
      updated_at: new Date().toISOString(),
    },
    system_status: {
      backend: backendAvailable ? "connected" : "unavailable",
      dashboard: "connected",
      side_effects: status?.side_effects_enabled ? "enabled" : "disabled",
    },
  }), [activeUser?.id]);

  const loadRuntimeStatus = useCallback(async () => {
    if (!activeUser) return;
    try {
      const response = isLocalDemo
        ? await fetchLocalDemoStatus()
        : await fetchWithRetry(`${DELTA_API_URL}/bedroom-copilot/${activeUser.id}/status`, { headers: authHeaders });
      const data = await response.json();
      if (!response.ok) return;
      setRuntimeStatus(data.runtime_status || null);
      setDashboard((current) => {
        if (!current) return current;
        return {
          ...current,
          runtime_status: data.runtime_status || current.runtime_status,
          recent_events: data.recent_events || current.recent_events,
          interventions: data.recent_interventions || current.interventions,
          behavioral_loop: data.late_caffeine_state
            ? { ...(current.behavioral_loop || {}), late_caffeine: data.late_caffeine_state }
            : current.behavioral_loop,
          system_status: { ...(current.system_status || {}), backend: isLocalDemo ? "connected" : current.system_status?.backend || "connected" },
        };
      });
    } catch (err) {
      if (isLocalDemo) {
        setRuntimeStatus((current) => current ? {
          ...current,
          backend_available: false,
          error_state: LOCAL_DEMO_BACKEND_UNAVAILABLE,
          errors: [LOCAL_DEMO_BACKEND_UNAVAILABLE, ...(current.errors || [])],
        } : null);
        setDashboard((current) => current ? {
          ...current,
          system_status: { ...(current.system_status || {}), backend: "unavailable" },
        } : buildLocalDemoDashboard(null, false));
        setError(err instanceof Error ? err.message : LOCAL_DEMO_BACKEND_UNAVAILABLE);
      }
      // Polling should not interrupt the authenticated dashboard while the API restarts.
    }
  }, [activeUser, authHeaders, buildLocalDemoDashboard, fetchLocalDemoStatus, isLocalDemo]);

  const loadDashboard = useCallback(async () => {
    if (!activeUser) return;
    setIsRefreshing(true);
    setError("");
    try {
      if (isLocalDemo) {
        const statusResponse = await fetchLocalDemoStatus();
        const statusData: BedroomStatusResponse = await statusResponse.json();
        if (!statusResponse.ok) throw new Error(statusData.error || statusData.detail || "Status request failed");
        const status = statusData.runtime_status || null;
        setRuntimeStatus(status);
        setDashboard(buildLocalDemoDashboard(status, true, statusData));
        return;
      }
      const [dashboardResponse, statusResponse] = await Promise.all([
        fetchWithRetry(`${DELTA_API_URL}/behavioral-os/${activeUser.id}/dashboard`, { headers: authHeaders }),
        fetchWithRetry(`${DELTA_API_URL}/bedroom-copilot/${activeUser.id}/status`, { headers: authHeaders }),
      ]);
      const dashboardData = await dashboardResponse.json();
      const statusData = await statusResponse.json();
      if (!dashboardResponse.ok) throw new Error(dashboardData.error || "Dashboard request failed");
      if (!statusResponse.ok) throw new Error(statusData.error || "Status request failed");
      setDashboard(dashboardData);
      setRuntimeStatus(statusData.runtime_status || dashboardData.runtime_status || null);
    } catch (err) {
      if (isLocalDemo) {
        setRuntimeStatus(null);
        setDashboard(buildLocalDemoDashboard(null, false));
        setError(err instanceof Error ? err.message : LOCAL_DEMO_BACKEND_UNAVAILABLE);
      } else {
        setError(err instanceof Error ? err.message : "Unable to load dashboard");
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [activeUser, authHeaders, buildLocalDemoDashboard, fetchLocalDemoStatus, isLocalDemo]);

  useEffect(() => {
    if (activeUser && hasDashboardAccess) {
      loadDashboard();
    }
  }, [activeUser, hasDashboardAccess, loadDashboard]);

  useEffect(() => {
    if (!activeUser || !hasDashboardAccess) return;
    const interval = window.setInterval(() => {
      void loadRuntimeStatus();
    }, 2500);
    return () => window.clearInterval(interval);
  }, [activeUser, hasDashboardAccess, loadRuntimeStatus]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const sendTranscript = async () => {
    if (!activeUser || !transcript.trim()) return;
    if (isLocalDemo) {
      setError("Local demo cockpit is read-only. Run one of the dry-run commands below to update this view without real side effects.");
      return;
    }
    setIsSending(true);
    setError("");
    try {
      const response = await fetchWithRetry(`${DELTA_API_URL}/bedroom-copilot/audio/window`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          user_id: activeUser.id,
          transcript,
          audio_classification: audioClass,
          source: "dashboard_simulator",
          confidence: 0.86,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Transcript ingest failed");
      setDashboard((current) => ({
        ...(current || data),
        user_id: activeUser.id,
        live_audio_state: data.live_audio_state || current?.live_audio_state,
        runtime_status: data.runtime_status || current?.runtime_status,
        recent_events: [...(data.events || []), ...(current?.recent_events || [])],
        memory_writes: [...(data.memory_writes || []), ...(current?.memory_writes || [])],
        interventions: [...(data.interventions || []), ...(current?.interventions || [])].filter(Boolean),
        feedback_learning: data.feedback_learning || current?.feedback_learning,
        behavioral_loop: data.behavioral_loop || data.results?.[0]?.context?.behavioral_loop || current?.behavioral_loop,
        system_status: data.system_status || current?.system_status,
      }));
      setRuntimeStatus(data.runtime_status || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to ingest transcript");
    } finally {
      setIsSending(false);
    }
  };

  const recordFeedback = async (
    interventionId: string,
    outcome: "good_call" | "too_much" | "not_useful" | "remind_earlier" | "remind_later"
  ) => {
    if (!activeUser) return;
    setError("");
    try {
      const response = await fetchWithRetry(`${DELTA_API_URL}/behavioral-os/interventions/${interventionId}/feedback`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ user_id: activeUser.id, outcome }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Feedback failed");
      setDashboard((current) => {
        if (!current) return current;
        return {
          ...current,
          feedback_learning: data.updated_stats || current.feedback_learning,
          behavioral_loop: data.behavioral_loop || current.behavioral_loop,
          interventions: (current.interventions || []).map((item) => {
            const id = item.id || item.intervention_id;
            const evaluation = feedbackEvaluation(outcome);
            return id === interventionId ? {
              ...item,
              feedback_outcome: outcome,
              user_response: outcome,
              evaluation_label: evaluation.label,
              outcome_score: evaluation.score,
            } : item;
          }),
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to record feedback");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!activeUser || !hasDashboardAccess) return null;

  const audioState = dashboard?.live_audio_state;
  const liveStatus = runtimeStatus || dashboard?.runtime_status;
  const feedback = dashboard?.feedback_learning;
  const lateCaffeineLoop = dashboard?.behavioral_loop?.late_caffeine || liveStatus?.late_caffeine_state || undefined;
  const loopMetrics = lateCaffeineLoop?.metrics;
  const learnedAdaptations = lateCaffeineLoop?.learned_adaptations || [];
  const events = dashboard?.recent_events || [];
  const memories = dashboard?.memory_writes || [];
  const interventions = dashboard?.interventions || [];
  const statusEntries = Object.entries(dashboard?.system_status || {});
  const lastWindow: Record<string, unknown> =
    liveStatus?.last_audio_window && typeof liveStatus.last_audio_window === "object"
      ? liveStatus.last_audio_window
      : {};
  const audioDiagnostics = objectRecord(liveStatus?.audio_diagnostics) || {};
  const runnerConfig: Record<string, unknown> =
    liveStatus?.runner_config && typeof liveStatus.runner_config === "object"
      ? liveStatus.runner_config
      : {};
  const audioWindowEntries = Object.entries(lastWindow).filter(([key]) => key !== "raw_audio_path");
  const runnerConfigEntries = Object.entries(runnerConfig);
  const pipelineLog = liveStatus?.stages?.length ? liveStatus.stages : liveStatus?.pipeline_log || [];
  const preflightChecks = liveStatus?.preflight_checks || [];
  const micCheck = preflightChecks.find((item) => item.name === "mic");
  const transcriptionCheck = preflightChecks.find((item) => item.name === "transcription");
  const inferredMode =
    liveStatus?.mode ||
    liveStatus?.demo_mode ||
    compactValue(lastWindow.mode) ||
    (runnerConfig.dev_transcript_mode || runnerConfig.dry_run ? "simulator" : runnerConfig.live_mode ? "live" : "unknown");
  const scenarioName = liveStatus?.scenario || (typeof runnerConfig.scenario === "string" ? runnerConfig.scenario : "unknown");
  const lastDetectedEvent = liveStatus?.last_detected_event || liveStatus?.extracted_events?.[0] || null;
  const lastDecision = liveStatus?.last_intervention_decision || liveStatus?.decision || interventions[0];
  const decisionContext = lastDecision?.context || {};
  const decisionExplanation =
    liveStatus?.decision_explanation?.length
      ? liveStatus.decision_explanation
      : lastDecision?.decision_explanation?.length
      ? lastDecision.decision_explanation
      : stringList(decisionContext.decision_explanation);
  const interventionCopy =
    liveStatus?.intervention_copy ||
    lastDecision?.intervention_copy ||
    (typeof decisionContext.intervention_copy === "string" ? decisionContext.intervention_copy : undefined) ||
    lastDecision?.message;
  const adaptationSummary =
    liveStatus?.adaptation_summary?.length
      ? liveStatus.adaptation_summary
      : lastDecision?.adaptation_summary?.length
      ? lastDecision.adaptation_summary
      : stringList(decisionContext.adaptation_summary).length
        ? stringList(decisionContext.adaptation_summary)
        : stringList(lateCaffeineLoop?.adaptation?.last_feedback_summary);
  const sideEffectsEnabled = Boolean(liveStatus?.side_effects_enabled ?? runnerConfig.side_effects_enabled);
  const isDryRunMode = inferredMode.includes("dry-run");
  const sideEffectsStatus = sideEffectsEnabled ? "enabled" : isDryRunMode ? "disabled" : compactValue(lastDecision?.side_effect_status || "unknown");
  const feedbackLabel = liveStatus?.feedback || liveStatus?.feedback_submitted || lastDecision?.feedback_outcome || "none";
  const currentBackendConnected = isLocalDemo && dashboard?.system_status?.backend === "connected";
  const backendStatus = currentBackendConnected ? "connected" : liveStatus?.backend_available === true ? "passed" : liveStatus?.backend_available === false ? "unavailable" : "unknown";
  const dashboardStatus = liveStatus?.dashboard_available === true ? "passed" : liveStatus?.dashboard_available === false ? "unavailable" : "unknown";
  const statusAgeSeconds = liveStatus?.status_age_seconds;
  const isStatusStale = typeof statusAgeSeconds === "number" && statusAgeSeconds > 120;
  const inputSource = compactValue(liveStatus?.input_source || lastWindow.input_source || lastWindow.audio_source || runnerConfig.input_source);
  const transcriptionStatus = compactValue(liveStatus?.transcription_status || lastWindow.transcription_status);
  const runtimeTranscript = liveStatus?.latest_transcript || liveStatus?.last_transcript || null;
  const displayedTranscript = isLocalDemo
    ? liveStatus?.last_audio_window
      ? runtimeTranscript
      : null
    : runtimeTranscript || audioState?.latest_transcript || null;
  const recommendedNextSafeCommand =
    "cd /Users/egeng/delta-backend && .venv/bin/python -m late_caffeine_demo --user-id eric-demo --mode live --dry-run --once --max-seconds 20 --dashboard-url 'http://127.0.0.1:3000/dashboard?localDemo=1'";
  const stateAdaptation = lateCaffeineLoop?.adaptation || {};
  const learnedRules = stringList(stateAdaptation.learned_rules);
  const stateProvenance = liveStatus?.state_provenance;
  const persistedStateStatus = liveStatus?.persisted_state_status;
  const loopStatePersistence = compactValue(
    lateCaffeineLoop?.state_persistence ||
    liveStatus?.state_persistence ||
    stateProvenance?.persistence ||
    (isLocalDemo ? (isDryRunMode ? "simulated" : lateCaffeineLoop ? "snapshot" : "none") : lateCaffeineLoop ? "persisted" : "none")
  );
  const loopStateSource = compactValue(
    lateCaffeineLoop?.state_source ||
    liveStatus?.state_source ||
    stateProvenance?.source ||
    (loopStatePersistence === "simulated" ? "status JSON snapshot (simulated dry-run)" : loopStatePersistence === "persisted" ? "Supabase persisted state" : "no state found")
  );
  const loopStateIsSimulated =
    lateCaffeineLoop?.state_is_simulated === true ||
    liveStatus?.state_is_simulated === true ||
    stateProvenance?.is_simulated === true ||
    loopStatePersistence === "simulated";
  const loopStateFreshness = stateProvenance?.freshness || (isStatusStale ? "stale" : statusAgeSeconds === undefined || statusAgeSeconds === null ? "unknown" : "fresh");
  const lastFeedbackForState = loopMetrics?.last_outcome || lateCaffeineLoop?.last_outcome || feedbackLabel;
  const hasBackoffLearning = !loopStateIsSimulated && (
    ["too_much", "not_useful", "dont_mention_again"].includes(String(lastFeedbackForState)) ||
    Number(stateAdaptation.reduction_level || 0) > 0 ||
    Boolean(stateAdaptation.suppress_until)
  );
  const latestStage = liveStatus?.current_stage || liveStatus?.pipeline_stage || "unknown";
  const finalStatus = liveStatus?.final_status || "unknown";
  const eventDetails = objectRecord(lastDetectedEvent?.details);
  const caffeineSource = compactValue(eventDetails.source);
  const detectedTime = compactValue(eventDetails.time);
  const eventDecision: Partial<Intervention> = lastDecision || {};
  const decisionAction = eventDecision.should_intervene === false || eventDecision.delivery_status === "skipped"
    ? eventDecision.action === "store_silently" || eventDecision.action === "defer"
      ? "stay silent"
      : compactValue(eventDecision.action || "stay silent")
    : compactValue(eventDecision.action || "pending");
  const deliveryStatus = compactValue(liveStatus?.delivery_status || eventDecision.delivery_status || "unknown");
  const receptivenessScore = eventDecision.receptiveness_score ?? (typeof loopMetrics?.current_receptiveness_score === "number" ? loopMetrics.current_receptiveness_score : lateCaffeineLoop?.receptiveness_score);
  const cooldownUntil = eventDecision.cooldown_until || loopMetrics?.current_cooldown_until || lateCaffeineLoop?.current_cooldown_until;
  const timingOffset = stateAdaptation.intervention_offset_minutes ?? objectRecord(eventDecision.context).target_intervention_offset_minutes ?? 0;
  const suppressionStatus = stateAdaptation.suppress_until ? `active until ${compactValue(stateAdaptation.suppress_until)}` : "not active";
  const audioSource = compactValue(liveStatus?.audio_source || liveStatus?.input_source || lastWindow.audio_source || lastWindow.input_source);
  const classifierResult = compactValue(lastWindow.classification || audioState?.classification);
  const rmsValue = lastWindow.rms === undefined || lastWindow.rms === null ? compactValue(audioDiagnostics.rms_average) : compactValue(lastWindow.rms);
  const audioMetric = (key: string) => compactValue(lastWindow[key] ?? audioDiagnostics[key]);
  const audioDebugPath = compactValue(lastWindow.audio_debug_path ?? audioDiagnostics.audio_debug_path);
  const audioFailureSuggestion = compactValue(lastWindow.actionable_suggestion ?? audioDiagnostics.actionable_suggestion ?? liveStatus?.error_state);
  const inputAccepted = liveStatus?.speech_detected
    ? "accepted"
    : classifierResult !== "unknown" && !["user_speech", "other_person_speech"].includes(classifierResult)
      ? "filtered"
      : "not accepted";
  const noEventReason = lastDetectedEvent
    ? ""
    : lastDecision?.reasoning || liveStatus?.error_state || "No behavioral event extracted from the latest status.";
  const adaptationChanges = adaptationDiff(liveStatus?.learned_state_before, liveStatus?.learned_state_after);
  const stateWarnings = [
    ...stringList(stateProvenance?.warnings),
    ...(persistedStateStatus?.status && persistedStateStatus.status !== "reachable" ? [persistedStateStatus.reason || `Persisted state ${persistedStateStatus.status}.`] : []),
  ].filter(Boolean);
  const persistedStateUnavailable = Boolean(persistedStateStatus?.status && persistedStateStatus.status !== "reachable");
  const productDemoSummary = liveStatus?.product_demo_summary;
  const productDemoScenarios = Array.isArray(productDemoSummary?.scenarios) ? productDemoSummary.scenarios : [];
  const productDemoScenarioByName = new Map(productDemoScenarios.map((item) => [item.scenario, item]));
  const productDemoProofPoints = productDemoSummary?.proof_points ? Object.entries(productDemoSummary.proof_points) : [];
  const pipelineRows = pipelineStageDefinitions.map((definition) => {
    const entry = findPipelineStage(pipelineLog, definition.aliases);
    return {
      label: definition.label,
      status: entry?.status || "pending",
      sideEffect: entry?.side_effect_status || "none",
      timestamp: entry?.timestamp || entry?.at,
      summary: entry?.explanation || entry?.detail || "No status reported yet.",
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/delta-logo.svg" alt="Delta" width={40} height={40} className="rounded-lg" />
            <span className="text-xl font-bold">Delta</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/insights" className="text-muted transition-colors hover:text-foreground">Insights</Link>
            <Link href="/account" className="text-muted transition-colors hover:text-foreground">Account</Link>
            <button onClick={handleLogout} className="text-muted transition-colors hover:text-foreground">Sign out</button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Behavioral OS</p>
            <h1 className="mt-1 text-3xl font-semibold">Bedroom Copilot Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Inspect the live path from speech classification into structured events, memory writes, intervention decisions, and feedback learning.
            </p>
          </div>
          <button
            onClick={loadDashboard}
            disabled={isRefreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-primary/10 disabled:opacity-50"
          >
            <Icon name="activity" />
            {isRefreshing ? "Refreshing" : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {isStatusStale && (
          <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
            Status may be stale. Run a new dry-run scenario.
          </div>
        )}

        <div className="mb-5">
          <Panel title="Delta Bedroom Copilot / Behavioral OS" icon="check">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Mode</p>
                <p className="mt-1 text-sm font-semibold">{inferredMode}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Side Effects</p>
                <p className="mt-1 text-sm font-semibold">{sideEffectsStatus}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Scenario</p>
                <p className="mt-1 break-words text-sm font-semibold">{scenarioName}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Freshness</p>
                <p className="mt-1 text-sm font-semibold">{loopStateFreshness}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Final Status</p>
                <p className="mt-1 text-sm font-semibold">{finalStatus}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Latest Stage</p>
                <p className="mt-1 text-sm font-semibold">{latestStage}</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">
              This cockpit shows the proven late-caffeine loop only: observation to event, state, decision, simulated delivery, feedback, and adaptation.
            </p>
          </Panel>
        </div>

        <div className="mb-5">
          <Panel title="Product Demo Sequence" icon="check">
            {productDemoSummary ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted">Readiness</p>
                    <p className="mt-1 break-words text-sm font-semibold">{productDemoSummary.final_demo_readiness_status || "unknown"}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted">Scenarios</p>
                    <p className="mt-1 text-sm font-semibold">{productDemoSummary.scenarios_run ?? productDemoScenarios.length}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted">Passed</p>
                    <p className="mt-1 text-sm font-semibold">{productDemoSummary.scenarios_passed ?? productDemoScenarios.filter((item) => item.passed).length}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted">Failed</p>
                    <p className="mt-1 text-sm font-semibold">{productDemoSummary.scenarios_failed ?? productDemoScenarios.filter((item) => !item.passed).length}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted">State</p>
                    <p className="mt-1 text-sm font-semibold">
                      {productDemoSummary.state_provenance?.is_simulated ? "simulated" : productDemoSummary.state_provenance?.persistence || "unknown"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  {productDemoScenarios.map((scenario, index) => (
                    <div key={`${scenario.scenario}-${scenario.proof_key}-${index}`} className="rounded-md border border-border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{scenario.scenario || "scenario"}</p>
                          <p className="mt-1 text-xs leading-5 text-muted">{scenario.product_point || "No proof point reported."}</p>
                        </div>
                        <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${scenario.passed ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                          {scenario.status || (scenario.passed ? "passed" : "failed")}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-2 text-xs text-muted sm:grid-cols-2">
                        <p>Event: {scenario.event || "none"}</p>
                        <p>Decision: {scenario.decision || "none"}</p>
                        <p>Delivery: {scenario.delivery_status || "unknown"}</p>
                        <p>Feedback: {scenario.feedback || "none"}</p>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-muted">Adaptation: {scenario.adaptation || "none"}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted">Proof Points</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {productDemoProofPoints.map(([key, passed]) => (
                      <span key={key} className={`rounded-md px-2 py-1 text-xs ${passed ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                        {key.replaceAll("_", " ")}: {passed ? "passed" : "failed"}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-5 text-amber-500">
                  <p className="font-semibold">Still unproven</p>
                  <div className="mt-1 space-y-1">
                    {(productDemoSummary.remaining_unproven_items || []).map((item, index) => (
                      <p key={`${item}-${index}`}>- {item}</p>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="rounded-md border border-dashed border-border p-4 text-sm leading-6 text-muted">
                No product demo sequence summary yet. Run the one-command product demo from the Scenario Runner section to populate this panel.
              </p>
            )}
          </Panel>
        </div>

        <div className="mb-5">
          <Panel title="Pipeline Timeline" icon="activity">
            <div className="grid gap-2 md:grid-cols-2">
              {pipelineRows.map((row) => (
                <div key={row.label} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{row.label}</p>
                      <p className="mt-1 text-xs leading-5 text-muted">{row.summary}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {row.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                    <span>Side effect: {row.sideEffect}</span>
                    <span>{formatTime(row.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="mb-5 grid gap-5 lg:grid-cols-2">
          <Panel title="Observation" icon="send">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Input Source</p>
                <p className="mt-1 text-sm font-semibold">{inputSource}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Audio Source</p>
                <p className="mt-1 text-sm font-semibold">{audioSource}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Transcription</p>
                <p className="mt-1 text-sm font-semibold">{transcriptionStatus}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Classifier</p>
                <p className="mt-1 text-sm font-semibold">{classifierResult}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">RMS</p>
                <p className="mt-1 text-sm font-semibold">{rmsValue}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">RMS Max</p>
                <p className="mt-1 text-sm font-semibold">{audioMetric("rms_max")}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Peak</p>
                <p className="mt-1 text-sm font-semibold">{audioMetric("peak_amplitude")}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Speech Duration</p>
                <p className="mt-1 text-sm font-semibold">{audioMetric("speech_duration_seconds")}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Accepted</p>
                <p className="mt-1 text-sm font-semibold">{inputAccepted}</p>
              </div>
            </div>
            <div className="mt-3 rounded-md border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted">Transcript</p>
              <p className="mt-2 text-sm leading-6">{displayedTranscript || "No transcript has been ingested yet."}</p>
            </div>
          </Panel>

          <Panel title="Event" icon="database">
            {lastDetectedEvent ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted">Event Type</p>
                  <p className="mt-1 text-sm font-semibold">{lastDetectedEvent.event_type || "event"}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted">Caffeine Source</p>
                  <p className="mt-1 text-sm font-semibold">{caffeineSource}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted">Detected Time</p>
                  <p className="mt-1 text-sm font-semibold">{detectedTime}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted">Should Store</p>
                  <p className="mt-1 text-sm font-semibold">{compactValue(lastDetectedEvent.should_store)}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted">Urgency</p>
                  <p className="mt-1 text-sm font-semibold">{scoreLabel(lastDetectedEvent.urgency)}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted">Importance</p>
                  <p className="mt-1 text-sm font-semibold">{scoreLabel(lastDetectedEvent.importance)}</p>
                </div>
                <div className="rounded-md border border-border p-3 sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-muted">Event Source</p>
                  <p className="mt-1 break-words text-sm font-semibold">{lastDetectedEvent.source || "unknown"}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-border p-3">
                <p className="text-sm font-semibold">No behavioral event extracted</p>
                <p className="mt-2 text-sm leading-6 text-muted">{noEventReason}</p>
              </div>
            )}
          </Panel>

          <Panel title="Decision" icon="bell">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Action</p>
                <p className="mt-1 text-sm font-semibold">{decisionAction}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Delivery</p>
                <p className="mt-1 text-sm font-semibold">{deliveryStatus}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Receptiveness</p>
                <p className="mt-1 text-sm font-semibold">{scoreLabel(receptivenessScore)}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Cooldown</p>
                <p className="mt-1 text-sm font-semibold">{formatTime(cooldownUntil || undefined)}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Suppression</p>
                <p className="mt-1 break-words text-sm font-semibold">{suppressionStatus}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Timing Offset</p>
                <p className="mt-1 text-sm font-semibold">{compactValue(timingOffset)} minutes</p>
              </div>
            </div>
            <div className="mt-3 rounded-md border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted">Intervention Copy</p>
              <p className="mt-2 text-sm leading-6">{interventionCopy || "No intervention copy selected."}</p>
            </div>
            <div className="mt-3 rounded-md border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted">Decision Explanation</p>
              <div className="mt-2 space-y-1">
                {decisionExplanation.length === 0 ? (
                  <p className="text-sm text-muted">No decision explanation yet.</p>
                ) : decisionExplanation.map((item, index) => (
                  <p key={`${item}-${index}`} className="text-sm leading-6 text-muted">- {item}</p>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Feedback and Adaptation" icon="clock">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Feedback</p>
                <p className="mt-1 text-sm font-semibold">{feedbackLabel}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Next Behavior</p>
                <p className="mt-1 text-sm font-semibold">{adaptationSummary.length > 0 ? "adapted" : "unchanged"}</p>
              </div>
            </div>
            <div className="mt-3 rounded-md border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted">Adaptation Summary</p>
              <div className="mt-2 space-y-1">
                {adaptationSummary.length === 0 ? (
                  <p className="text-sm text-muted">No feedback adaptation has been recorded yet.</p>
                ) : adaptationSummary.map((item, index) => (
                  <p key={`${item}-${index}`} className="text-sm leading-6 text-muted">- {item}</p>
                ))}
              </div>
            </div>
            <div className="mt-3 rounded-md border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted">Before / After</p>
              <div className="mt-2 space-y-1">
                {adaptationChanges.length === 0 ? (
                  <p className="text-sm text-muted">No adaptation diff is available for this run.</p>
                ) : adaptationChanges.map((item) => (
                  <div key={item.key} className="flex items-start justify-between gap-3 text-xs">
                    <span className="text-muted">{item.key.replaceAll("_", " ")}</span>
                    <span className="max-w-64 break-words text-right font-medium">{compactValue(item.before)}{" -> "}{compactValue(item.after)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        <div className="mb-5">
          <Panel title="Feedback Preview" icon="clock">
            <p className="mb-3 text-sm leading-6 text-muted">
              These are simulated feedback meanings for the late-caffeine loop. Use the CLI preview command to inspect before/after state without Supabase writes.
            </p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {FEEDBACK_CONTRACT.map((option) => (
                <div key={option.internalOutcome} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{option.label}</p>
                    <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
                      {option.internalOutcome}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted">{option.explanation}</p>
                  <div className="mt-3 space-y-1 text-xs text-muted">
                    <p>Tone: {option.toneEffect}</p>
                    <p>Cooldown: {option.cooldownEffect}</p>
                    <p>Frequency: {option.frequencyEffect}</p>
                    <p>Suppression: {option.suppressionEffect}</p>
                    <p>Timing: {option.timingOffsetEffect}</p>
                  </div>
                  <p className="mt-3 rounded-md bg-background p-2 text-xs leading-5 text-muted">
                    {option.exampleAdaptationSummary}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="mb-5">
          <Panel title="Scenario Runner" icon="send">
            <p className="mb-3 text-sm leading-6 text-muted">
              The local demo cockpit is read-only. Scenario Runner Commands are copied into Terminal so side effects stay explicit and simulated.
            </p>
            <div className="mb-3 rounded-md border border-primary/30 bg-primary/10 p-3">
              <p className="text-xs uppercase tracking-wide text-primary">one-command product demo</p>
              <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-background p-3 text-xs leading-5 text-muted">{productDemoCommand}</pre>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {DEMO_SCENARIO_FIXTURES.map((item) => {
                const observed = productDemoScenarioByName.get(item.scenario);
                return (
                <div key={item.scenario} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{item.scenario}</p>
                      <p className="mt-1 text-xs leading-5 text-muted">{item.proofPoint}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-background px-2 py-1 text-xs text-muted">
                      {observed ? observed.status || (observed.passed ? "passed" : "failed") : "not run"}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-2">
                    <p>Input: {item.input}</p>
                    <p>Expected event: {item.expectedEvent}</p>
                    <p>Expected decision: {item.expectedDecision}</p>
                    <p>Expected adaptation: {item.expectedAdaptation}</p>
                  </div>
                  {observed && (
                    <div className="mt-3 rounded-md border border-border/70 p-2 text-xs leading-5 text-muted">
                      Latest observed result: event {observed.event || "none"}; decision {observed.decision || "none"}; delivery {observed.delivery_status || "unknown"}.
                    </div>
                  )}
                  <pre className="mt-3 whitespace-pre-wrap break-words rounded-md bg-background p-3 text-xs leading-5 text-muted">{item.command}</pre>
                </div>
                );
              })}
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Panel title="Live Audio State" icon="activity">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Pipeline Stage</p>
                <p className="mt-1 text-lg font-semibold">{liveStatus?.pipeline_stage || audioState?.status || "No signal"}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Mic State</p>
                <p className="mt-1 text-lg font-semibold">{liveStatus?.mic_state || "unknown"}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Mode</p>
                <p className="mt-1 text-sm font-semibold">{inferredMode}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Listening</p>
                <p className="mt-1 text-sm font-semibold">{liveStatus?.is_listening ? "yes" : "no"}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Speech</p>
                <p className="mt-1 text-sm font-semibold">{liveStatus?.speech_detected ? "detected" : "not detected"}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Input Source</p>
                <p className="mt-1 text-sm font-semibold">{inputSource}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Transcription</p>
                <p className="mt-1 text-sm font-semibold">{transcriptionStatus}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Classification</p>
                <p className="mt-1 text-sm font-semibold">{compactValue(lastWindow.classification || audioState?.classification)}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Updated</p>
                <p className="mt-1 text-sm font-semibold">{formatTime(liveStatus?.updated_at)}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Status Age</p>
                <p className="mt-1 text-sm font-semibold">{formatStatusAge(liveStatus?.status_age_seconds)}</p>
              </div>
            </div>
            <div className="mt-3 rounded-md border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted">Current Transcript</p>
              <p className="mt-2 min-h-12 text-sm leading-6">{displayedTranscript || "No transcript has been ingested yet."}</p>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Last Audio Window</p>
                <div className="mt-2 space-y-1">
                  {audioWindowEntries.length === 0 ? (
                    <p className="text-sm text-muted">No window captured.</p>
                  ) : audioWindowEntries.map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-3 text-xs">
                      <span className="text-muted">{key.replaceAll("_", " ")}</span>
                      <span className="max-w-44 break-words text-right font-medium">{compactValue(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Audio Diagnostics</p>
                <div className="mt-2 space-y-1">
                  {[
                    ["Input device", audioMetric("input_device")],
                    ["Sample rate", audioMetric("sample_rate")],
                    ["VAD threshold", audioMetric("vad_threshold")],
                    ["Min speech seconds", audioMetric("min_speech_seconds")],
                    ["Silence timeout", audioMetric("silence_timeout_seconds")],
                    ["RMS average", audioMetric("rms_average")],
                    ["RMS max", audioMetric("rms_max")],
                    ["Peak amplitude", audioMetric("peak_amplitude")],
                    ["Noise floor", audioMetric("estimated_noise_floor")],
                    ["Suggested threshold", audioMetric("suggested_vad_threshold")],
                    ["Speech detected", audioMetric("speech_detected")],
                    ["Speech duration", audioMetric("speech_duration_seconds")],
                    ["Audio debug saved", audioMetric("audio_debug_saved")],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-start justify-between gap-3 text-xs">
                      <span className="text-muted">{label}</span>
                      <span className="max-w-44 break-words text-right font-medium">{value}</span>
                    </div>
                  ))}
                </div>
                {audioDebugPath !== "unknown" && (
                  <p className="mt-3 break-words rounded-md bg-background p-2 text-xs text-muted">Debug WAV: {audioDebugPath}</p>
                )}
                {audioFailureSuggestion !== "unknown" && (
                  <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700">
                    {audioFailureSuggestion}
                  </p>
                )}
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Runner Config</p>
                <div className="mt-2 space-y-1">
                  {runnerConfigEntries.length === 0 ? (
                    <p className="text-sm text-muted">Runner has not reported config.</p>
                  ) : runnerConfigEntries.map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-3 text-xs">
                      <span className="text-muted">{key.replaceAll("_", " ")}</span>
                      <span className="max-w-44 break-words text-right font-medium">{compactValue(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {liveStatus?.error_state && (
              <p className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
                {liveStatus.error_state}
              </p>
            )}
            <p className="mt-3 text-xs text-muted">
              Raw audio retained: {audioState?.raw_audio_retained ? "yes" : "no"}
            </p>
          </Panel>

          <Panel title="Audio Window Ingest" icon="send">
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setTranscript(prompt)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-primary hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <textarea
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              className="mt-4 min-h-28 w-full resize-y rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary"
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <select
                value={audioClass}
                onChange={(event) => setAudioClass(event.target.value)}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              >
                <option value="user_speech">user_speech</option>
                <option value="other_person_speech">other_person_speech</option>
                <option value="tv">tv</option>
                <option value="music">music</option>
                <option value="ambient_noise">ambient_noise</option>
              </select>
            <button
                onClick={sendTranscript}
                disabled={isSending || !transcript.trim() || isLocalDemo}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
              >
                <Icon name="send" />
                {isLocalDemo ? "CLI dry-run only" : isSending ? "Processing" : "Process Window"}
              </button>
            </div>
            {isLocalDemo && (
              <p className="mt-3 text-xs leading-5 text-muted">
                Local demo mode does not call the ingest endpoint from the browser. Use the Scenario Runner commands to keep side effects simulated and state provenance explicit.
              </p>
            )}
          </Panel>
        </div>

        <div className="mt-5">
          <Panel title="Behavioral Loop: Late Caffeine" icon="clock">
            <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Demo Mode</p>
                <p className="mt-1 text-sm font-semibold">{inferredMode}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Scenario</p>
                <p className="mt-1 break-words text-sm font-semibold">{scenarioName}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Side Effects</p>
                <p className="mt-1 text-sm font-semibold">{sideEffectsStatus}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Current Stage</p>
                <p className="mt-1 text-sm font-semibold">{liveStatus?.current_stage || liveStatus?.pipeline_stage || "unknown"}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Final Status</p>
                <p className="mt-1 text-sm font-semibold">{liveStatus?.final_status || "unknown"}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Final Result</p>
                <p className="mt-1 text-sm font-semibold">{liveStatus?.final_result || "pending"}</p>
              </div>
            </div>
            <div className="mb-3 grid gap-3 md:grid-cols-4">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Run ID</p>
                <p className="mt-1 break-words text-xs font-semibold">{liveStatus?.run_id || "unknown"}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Started</p>
                <p className="mt-1 text-sm font-semibold">{formatTime(liveStatus?.started_at)}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Completed</p>
                <p className="mt-1 text-sm font-semibold">{formatTime(liveStatus?.completed_at || undefined)}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Status JSON</p>
                <p className="mt-1 break-words text-xs font-semibold">{liveStatus?.status_log_path || "unknown"}</p>
              </div>
            </div>
            <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              {["backend", "dashboard", "env", "db_migrations", "mic", "delivery"].map((name) => {
                const check = preflightChecks.find((item) => item.name === name);
                const label = name === "env" ? "Supabase" : name === "db_migrations" ? "Migration" : name === "delivery" ? "Notification/TTS" : name;
                const status = check?.status || (name === "backend" ? backendStatus : name === "dashboard" ? dashboardStatus : "unknown");
                const explanation =
                  check?.explanation ||
                  (name === "backend" && currentBackendConnected ? "Current local backend fetch succeeded." : "") ||
                  (name === "backend" && liveStatus?.backend_available === true ? "Backend availability reported by status JSON." : "") ||
                  (name === "dashboard" && liveStatus?.dashboard_available === true ? "Dashboard availability reported by status JSON." : "");
                return (
                  <div key={name} className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
                    <p className="mt-1 text-sm font-semibold">{status}</p>
                    {explanation && <p className="mt-1 text-xs leading-5 text-muted">{explanation}</p>}
                  </div>
                );
              })}
            </div>
            <div className="mb-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Last Observation</p>
                <p className="mt-2 text-sm leading-6">{displayedTranscript || "No observation has been processed yet."}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Extracted Event</p>
                {lastDetectedEvent ? (
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="font-medium">{lastDetectedEvent.event_type || "event"}</p>
                    <p className="text-xs text-muted">{formatTime(lastDetectedEvent.timestamp)}</p>
                    <p className="break-words text-xs leading-5 text-muted">{lastDetectedEvent.raw_text || JSON.stringify(lastDetectedEvent.details || {})}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted">No behavioral event extracted yet.</p>
                )}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Delivered</p>
                <p className="mt-1 text-2xl font-semibold">{loopMetrics?.interventions_delivered ?? 0}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Accepted</p>
                <p className="mt-1 text-2xl font-semibold">{loopMetrics?.interventions_accepted ?? 0}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Ignored</p>
                <p className="mt-1 text-2xl font-semibold">{loopMetrics?.interventions_ignored ?? 0}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Annoying</p>
                <p className="mt-1 text-2xl font-semibold">{loopMetrics?.interventions_annoying ?? 0}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Success</p>
                <p className="mt-1 text-2xl font-semibold">
                  {loopMetrics?.success_rate === null || loopMetrics?.success_rate === undefined ? "No data" : `${Math.round(loopMetrics.success_rate * 100)}%`}
                </p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Receptiveness</p>
                <p className="mt-1 text-lg font-semibold">{scoreLabel(loopMetrics?.current_receptiveness_score ?? lateCaffeineLoop?.receptiveness_score)}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Cooldown Until</p>
                <p className="mt-1 text-sm font-semibold">{formatTime(loopMetrics?.current_cooldown_until || lateCaffeineLoop?.current_cooldown_until || undefined)}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Last Outcome</p>
                <p className="mt-1 text-sm font-semibold">{loopMetrics?.last_outcome || lateCaffeineLoop?.last_outcome || "none"}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Current Adaptation</p>
                <div className="mt-2 space-y-1">
                  {Object.entries(lateCaffeineLoop?.adaptation || {}).length === 0 ? (
                    <p className="text-sm text-muted">No adaptation state yet.</p>
                  ) : Object.entries(lateCaffeineLoop?.adaptation || {}).filter(([key]) => key !== "learned_rules").map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-3 text-xs">
                      <span className="text-muted">{key.replaceAll("_", " ")}</span>
                      <span className="max-w-52 break-words text-right font-medium">{compactValue(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Learned Adaptations</p>
                <div className="mt-2 space-y-2">
                  {learnedAdaptations.length === 0 ? (
                    <p className="text-sm text-muted">No feedback-derived adaptations yet.</p>
                  ) : learnedAdaptations.slice(0, 6).map((item, index) => (
                    <div key={`${item.type}-${index}`} className="rounded-md border border-border/70 p-2">
                      <p className="text-xs font-medium">{compactValue(item.type)}: {compactValue(item.value)}</p>
                      {item.reason && <p className="mt-1 text-xs leading-5 text-muted">{item.reason}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Decision Explanation</p>
                <div className="mt-2 space-y-1">
                  {decisionExplanation.length === 0 ? (
                    <p className="text-sm text-muted">No decision explanation yet.</p>
                  ) : decisionExplanation.map((item, index) => (
                    <p key={`${item}-${index}`} className="text-sm leading-6 text-muted">- {item}</p>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Intervention Copy</p>
                <p className="mt-2 text-sm leading-6">{interventionCopy || "No message selected."}</p>
                <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-2">
                  <p>Decision: {lastDecision?.should_intervene ? "intervene" : lastDecision ? "stay silent" : "pending"}</p>
                  <p>Delivery: {liveStatus?.delivery_status || lastDecision?.delivery_status || "unknown"}</p>
                  <p>Feedback: {feedbackLabel}</p>
                  <p>Side effect: {lastDecision?.side_effect_status || sideEffectsStatus}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 rounded-md border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted">What Changed?</p>
              <div className="mt-2 space-y-1">
                {adaptationSummary.length === 0 ? (
                  <p className="text-sm text-muted">No feedback adaptation has been recorded yet.</p>
                ) : adaptationSummary.map((item, index) => (
                  <p key={`${item}-${index}`} className="text-sm leading-6 text-muted">- {item}</p>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        <div className="mt-5">
          <Panel title="Late-Caffeine State Inspector" icon="database">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">State Source</p>
                <p className="mt-1 break-words text-sm font-semibold">{loopStateSource}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Persistence</p>
                <p className="mt-1 text-sm font-semibold">{loopStatePersistence}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Freshness</p>
                <p className="mt-1 text-sm font-semibold">{loopStateFreshness}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Last Feedback</p>
                <p className="mt-1 text-sm font-semibold">{lastFeedbackForState || "none"}</p>
              </div>
            </div>
            {loopStateIsSimulated && (
              <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-5 text-amber-500">
                Simulated dry-run learning is visible for demo inspection only. It is not the persisted user profile.
              </p>
            )}
            {persistedStateUnavailable && (
              <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-5 text-amber-500">
                Persisted Supabase state unavailable. Showing simulated local demo/status state.
              </p>
            )}
            {stateWarnings.length > 0 && (
              <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-5 text-amber-500">
                <p className="font-semibold">State provenance warnings</p>
                <div className="mt-1 space-y-1">
                  {stateWarnings.map((warning, index) => (
                    <p key={`${warning}-${index}`}>- {warning}</p>
                  ))}
                </div>
              </div>
            )}
            {hasBackoffLearning && (
              <p className="mt-3 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm leading-6 text-primary">
                Delta learned to back off: persisted feedback shows this late-caffeine intervention should be softer, less frequent, or temporarily suppressed.
              </p>
            )}
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Tone</p>
                <p className="mt-1 text-sm font-semibold">{compactValue(stateAdaptation.tone)}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Cooldown</p>
                <p className="mt-1 text-sm font-semibold">{compactValue(stateAdaptation.cooldown_minutes)} minutes</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Timing Offset</p>
                <p className="mt-1 text-sm font-semibold">{compactValue(stateAdaptation.intervention_offset_minutes)} minutes</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Reduction Level</p>
                <p className="mt-1 text-sm font-semibold">{compactValue(stateAdaptation.reduction_level)}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Suppression</p>
                <p className="mt-1 break-words text-sm font-semibold">{compactValue(stateAdaptation.suppress_until)}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Delivery Method</p>
                <p className="mt-1 text-sm font-semibold">{compactValue(stateAdaptation.delivery_method)}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Learned Rules</p>
                <div className="mt-2 space-y-1">
                  {learnedRules.length === 0 ? (
                    <p className="text-sm text-muted">No learned rules in this state.</p>
                  ) : learnedRules.slice(0, 5).map((rule, index) => (
                    <p key={`${rule}-${index}`} className="text-sm leading-6 text-muted">- {rule}</p>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Last Adaptation Summary</p>
                <div className="mt-2 space-y-1">
                  {stringList(stateAdaptation.last_feedback_summary).length === 0 ? (
                    <p className="text-sm text-muted">No feedback summary in this state.</p>
                  ) : stringList(stateAdaptation.last_feedback_summary).map((item, index) => (
                    <p key={`${item}-${index}`} className="text-sm leading-6 text-muted">- {item}</p>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="mt-5">
          <Panel title="Live Readiness" icon="check">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Backend Reachable</p>
                <p className="mt-1 text-sm font-semibold">{backendStatus}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Dashboard Connected</p>
                <p className="mt-1 text-sm font-semibold">{dashboardStatus}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Status JSON Fresh</p>
                <p className="mt-1 text-sm font-semibold">{isStatusStale ? "stale" : statusAgeSeconds === undefined || statusAgeSeconds === null ? "unknown" : "fresh"}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Current Mode</p>
                <p className="mt-1 text-sm font-semibold">{inferredMode}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Side Effects Enabled</p>
                <p className="mt-1 text-sm font-semibold">{sideEffectsEnabled ? "yes" : "no"}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Microphone</p>
                <p className="mt-1 text-sm font-semibold">{micCheck?.status || "required for live mode"}</p>
                {micCheck?.explanation && <p className="mt-1 text-xs leading-5 text-muted">{micCheck.explanation}</p>}
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Transcription</p>
                <p className="mt-1 text-sm font-semibold">{transcriptionCheck?.status || transcriptionStatus || "required for live mode"}</p>
                {transcriptionCheck?.explanation && <p className="mt-1 text-xs leading-5 text-muted">{transcriptionCheck.explanation}</p>}
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Supabase</p>
                <p className="mt-1 text-sm font-semibold">{persistedStateStatus?.status || "required for real persistence"}</p>
                {persistedStateStatus?.reason && <p className="mt-1 text-xs leading-5 text-muted">{persistedStateStatus.reason}</p>}
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Notifications/TTS</p>
                <p className="mt-1 text-sm font-semibold">require explicit confirmation</p>
              </div>
            </div>
            <div className="mt-3 rounded-md border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted">Recommended Next Safe Command</p>
              <p className="mt-2 break-words text-xs leading-5 text-muted">{recommendedNextSafeCommand}</p>
            </div>
          </Panel>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <Panel title="Detected Events" icon="database">
            <div className="space-y-3">
              {events.length === 0 ? <EmptyState text="No structured events yet." /> : events.slice(0, 8).map((event, index) => (
                <div key={`${event.id || event.event_type}-${index}`} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{event.event_type || "event"}</p>
                      <p className="mt-1 text-xs text-muted">{formatTime(event.timestamp)}</p>
                    </div>
                    <div className="text-right text-xs text-muted">
                      <p>I {scoreLabel(event.importance)}</p>
                      <p>U {scoreLabel(event.urgency)}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-muted">{event.raw_text || JSON.stringify(event.details || {})}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Memory Writes" icon="brain">
            <div className="space-y-3">
              {memories.length === 0 ? <EmptyState text="No memory writes yet." /> : memories.slice(0, 8).map((memory, index) => (
                <div key={`${memory.id || memory.content}-${index}`} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{memory.memory_type || "memory"}</p>
                    <p className="text-xs text-muted">{scoreLabel(memory.confidence)}</p>
                  </div>
                  <p className="mt-2 break-words text-sm leading-5 text-muted">{memory.content}</p>
                  <p className="mt-2 text-xs text-muted">{memory.source_event_type || "source unknown"}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Feedback Learning" icon="clock">
            <div className="rounded-md border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted">Success Rate</p>
              <p className="mt-1 text-2xl font-semibold">
                {feedback?.success_rate === null || feedback?.success_rate === undefined ? "No data" : `${Math.round(feedback.success_rate * 100)}%`}
              </p>
              <p className="mt-1 text-xs text-muted">{feedback?.total || 0} feedback outcomes</p>
            </div>
            <div className="mt-3 space-y-2">
              {(feedback?.timing_guidance || []).length === 0 ? (
                <p className="rounded-md border border-border p-3 text-sm text-muted">No timing guidance yet.</p>
              ) : feedback?.timing_guidance?.map((item) => (
                <div key={`${item.scope}-${item.value}`} className="rounded-md border border-border p-3">
                  <p className="text-sm font-medium">{item.recommendation.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{item.reason}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <Panel title="Interventions" icon="bell">
            <div className="space-y-3">
              {interventions.length === 0 ? <EmptyState text="No intervention decisions yet." /> : interventions.slice(0, 10).map((intervention, index) => {
                const id = intervention.id || intervention.intervention_id || "";
                return (
                  <div key={`${id}-${index}`} className="rounded-md border border-border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">{intervention.action || "decision"}</span>
                          <span className="rounded-md border border-border px-2 py-1 text-xs text-muted">{intervention.channel || "none"}</span>
                          <span className="rounded-md border border-border px-2 py-1 text-xs text-muted">{intervention.event_type || "event"}</span>
                          {intervention.domain && <span className="rounded-md border border-border px-2 py-1 text-xs text-muted">{intervention.domain}</span>}
                          {intervention.delivery_status && <span className="rounded-md border border-border px-2 py-1 text-xs text-muted">{intervention.delivery_status}</span>}
                        </div>
                        {intervention.message && <p className="mt-3 text-sm font-medium">{intervention.message}</p>}
                        <p className="mt-2 text-sm leading-5 text-muted">{intervention.reasoning}</p>
                        <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-2">
                          <p>Delivered: {formatTime(intervention.delivered_at || undefined)}</p>
                          <p>Method: {intervention.delivery_method || "none"}</p>
                          <p>Receptiveness: {scoreLabel(intervention.receptiveness_score ?? undefined)}</p>
                          <p>Cooldown: {formatTime(intervention.cooldown_until || undefined)}</p>
                          <p>Evaluation: {intervention.evaluation_label || intervention.user_response || "pending"}</p>
                          <p>Score: {intervention.outcome_score === null || intervention.outcome_score === undefined ? "pending" : scoreLabel(intervention.outcome_score)}</p>
                        </div>
                      </div>
                      {id && (
                        <div className="flex shrink-0 flex-wrap gap-2 md:max-w-64 md:justify-end">
                          <button
                            onClick={() => recordFeedback(id, "good_call")}
                            className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs text-green-500 hover:bg-green-500/10"
                          >
                            Good call
                          </button>
                          <button
                            onClick={() => recordFeedback(id, "too_much")}
                            className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs text-red-500 hover:bg-red-500/10"
                          >
                            Too much
                          </button>
                          <button
                            onClick={() => recordFeedback(id, "not_useful")}
                            className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs text-muted hover:bg-primary/10 hover:text-foreground"
                          >
                            Not useful
                          </button>
                          <button
                            onClick={() => recordFeedback(id, "remind_earlier")}
                            className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs text-muted hover:bg-primary/10 hover:text-foreground"
                          >
                            Earlier
                          </button>
                          <button
                            onClick={() => recordFeedback(id, "remind_later")}
                            className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs text-muted hover:bg-primary/10 hover:text-foreground"
                          >
                            Later
                          </button>
                        </div>
                      )}
                    </div>
                    {intervention.feedback_outcome && (
                      <p className="mt-3 text-xs text-muted">Feedback: {intervention.feedback_outcome}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Layer Status" icon="activity">
            <div className="space-y-2">
              {statusEntries.length === 0 ? <EmptyState text="Status unavailable." /> : statusEntries.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                  <span className="text-sm">{key.replaceAll("_", " ")}</span>
                  <span className="max-w-40 truncate rounded-md bg-green-500/10 px-2 py-1 text-xs text-green-500">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-md border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted">Pipeline Log</p>
              <div className="mt-2 space-y-2">
                {pipelineLog.length === 0 ? (
                  <p className="text-sm text-muted">No harness log entries yet.</p>
                ) : pipelineLog.slice(-8).reverse().map((entry, index) => (
                  <div key={`${entry.timestamp || entry.at}-${entry.stage}-${index}`} className="rounded-md border border-border/70 p-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{entry.stage || "stage"}</span>
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-primary">{entry.status || "status"}</span>
                    </div>
                    <p className="mt-1 leading-5 text-muted">{entry.explanation || entry.detail || "No detail"}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-muted">
                      <span>{formatTime(entry.timestamp || entry.at)}</span>
                      <span>Side effect: {entry.side_effect_status || "none"}</span>
                    </div>
                    {entry.intervention_copy && (
                      <p className="mt-2 rounded-md bg-primary/5 p-2 leading-5">{entry.intervention_copy}</p>
                    )}
                    {entry.decision_explanation && entry.decision_explanation.length > 0 && (
                      <div className="mt-2 space-y-1 text-muted">
                        {entry.decision_explanation.slice(0, 3).map((item, itemIndex) => (
                          <p key={`${item}-${itemIndex}`}>- {item}</p>
                        ))}
                      </div>
                    )}
                    {entry.adaptation_summary && entry.adaptation_summary.length > 0 && (
                      <div className="mt-2 space-y-1 text-muted">
                        {entry.adaptation_summary.slice(0, 3).map((item, itemIndex) => (
                          <p key={`${item}-${itemIndex}`}>Changed: {item}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </main>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted">{text}</p>;
}
