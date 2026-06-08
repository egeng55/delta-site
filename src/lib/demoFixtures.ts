import type { FeedbackOption } from "./feedbackContract";

export type DemoScenarioFixture = {
  scenario: string;
  proofPoint: string;
  input: string;
  expectedEvent: string;
  expectedDecision: string;
  expectedAdaptation: string;
  command: string;
};

const backendPrefix = "cd /Users/egeng/delta-backend && .venv/bin/python -m late_caffeine_demo";
const dashboard = "--dashboard-url 'http://127.0.0.1:3000/dashboard?localDemo=1'";
const dry = "--user-id eric-demo --dry-run";

export const DEMO_SCENARIO_FIXTURES: DemoScenarioFixture[] = [
  {
    scenario: "ambient_noise",
    proofPoint: "Delta can stay silent on ambient or non-behavioral input.",
    input: "TV chatter and music in the background.",
    expectedEvent: "none",
    expectedDecision: "stay silent",
    expectedAdaptation: "No mutation; input is filtered.",
    command: `${backendPrefix} ${dry} --scenario ambient_noise ${dashboard} --no-start-backend --no-start-dashboard`,
  },
  {
    scenario: "late_caffeine_first_time",
    proofPoint: "Delta can extract a late-caffeine event and simulate intervention delivery.",
    input: "I just drank a Monster and it's 10 PM.",
    expectedEvent: "caffeine / Monster / 22:00",
    expectedDecision: "notify",
    expectedAdaptation: "Good-call feedback keeps the intervention eligible.",
    command: `${backendPrefix} ${dry} --scenario late_caffeine_first_time ${dashboard} --no-start-backend --no-start-dashboard`,
  },
  {
    scenario: "late_caffeine_after_too_much_feedback",
    proofPoint: "Negative feedback can suppress, soften, or reduce future intervention behavior.",
    input: "I just drank a Monster and it's 10 PM.",
    expectedEvent: "caffeine / Monster / 22:00",
    expectedDecision: "stay silent or softened notify",
    expectedAdaptation: "Tone softens, cooldown increases, frequency reduces, suppression may activate.",
    command: `${backendPrefix} ${dry} --scenario late_caffeine_after_too_much_feedback ${dashboard} --no-start-backend --no-start-dashboard`,
  },
  {
    scenario: "late_caffeine_after_good_call_feedback",
    proofPoint: "Positive feedback keeps concise/direct intervention eligible.",
    input: "I had coffee around 8 PM.",
    expectedEvent: "caffeine / coffee / 20:00",
    expectedDecision: "notify",
    expectedAdaptation: "Concise/direct behavior remains eligible.",
    command: `${backendPrefix} ${dry} --scenario late_caffeine_after_good_call_feedback ${dashboard} --no-start-backend --no-start-dashboard`,
  },
  {
    scenario: "late_caffeine_after_remind_earlier_feedback",
    proofPoint: "Timing feedback can shift future warnings earlier.",
    input: "I took pre-workout at 7 PM.",
    expectedEvent: "caffeine / pre-workout / 19:00",
    expectedDecision: "notify",
    expectedAdaptation: "Timing offset is visible as -30 minutes.",
    command: `${backendPrefix} ${dry} --scenario late_caffeine_after_remind_earlier_feedback ${dashboard} --no-start-backend --no-start-dashboard`,
  },
  {
    scenario: "typed_live_fallback",
    proofPoint: "Live-mode wrapper can process user-provided live input without microphone dependency.",
    input: "I just drank a Monster and it's 10 PM.",
    expectedEvent: "caffeine / Monster / 22:00",
    expectedDecision: "notify",
    expectedAdaptation: "Simulated feedback updates local status only.",
    command: `${backendPrefix} --user-id eric-demo --mode live --dry-run --once --max-seconds 20 --transcript "I just drank a Monster and it's 10 PM." ${dashboard}`,
  },
  {
    scenario: "mic_silence",
    proofPoint: "Live mic diagnostics can report silence instead of faking a behavioral event.",
    input: "No speech-like audio captured.",
    expectedEvent: "none",
    expectedDecision: "none",
    expectedAdaptation: "No mutation; audio failure is diagnostic.",
    command: `${backendPrefix} --mode live --calibrate-audio --max-seconds 5`,
  },
  {
    scenario: "transcription_empty",
    proofPoint: "Audio replay can show when transcription produced empty text.",
    input: "Saved WAV with no transcript.",
    expectedEvent: "none",
    expectedDecision: "none",
    expectedAdaptation: "No mutation; replay remains dry-run only.",
    command: `${backendPrefix} --dry-run --transcribe-audio-file debug_audio/<file>.wav`,
  },
  {
    scenario: "supabase_unavailable",
    proofPoint: "Paused Supabase is labeled as blocked persistence, not demo failure.",
    input: "Supabase paused or unreachable.",
    expectedEvent: "status only",
    expectedDecision: "n/a",
    expectedAdaptation: "Simulated status remains available; persisted state unavailable.",
    command: `${backendPrefix} --local-health`,
  },
  {
    scenario: "stale_status",
    proofPoint: "Old status JSON is flagged so stale learning is not presented as fresh.",
    input: "Status age exceeds freshness threshold.",
    expectedEvent: "previous snapshot",
    expectedDecision: "previous snapshot",
    expectedAdaptation: "Dashboard warns to run a new scenario.",
    command: `${backendPrefix} ${dry} --scenario late_caffeine_first_time ${dashboard} --no-start-backend --no-start-dashboard`,
  },
];

export type DemoStatusFixture = {
  scenario: string;
  state_persistence: "simulated" | "snapshot" | "persisted" | "unavailable";
  final_status: string;
  extracted_events: Array<Record<string, unknown>>;
};

export const DEMO_STATUS_FIXTURES: Record<string, DemoStatusFixture> = {
  ambient_filtered: {
    scenario: "ambient_noise",
    state_persistence: "simulated",
    final_status: "passed",
    extracted_events: [],
  },
  first_time_late_caffeine: {
    scenario: "late_caffeine_first_time",
    state_persistence: "simulated",
    final_status: "passed",
    extracted_events: [{ event_type: "caffeine", details: { source: "Monster", time: "22:00" } }],
  },
  supabase_unavailable: {
    scenario: "supabase_unavailable",
    state_persistence: "unavailable",
    final_status: "passed",
    extracted_events: [],
  },
};

export function feedbackPreviewText(option: FeedbackOption) {
  return `${option.label}: ${option.exampleAdaptationSummary}`;
}
