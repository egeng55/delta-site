import { DEMO_SCENARIO_FIXTURES, DEMO_STATUS_FIXTURES, feedbackPreviewText } from "./demoFixtures";
import { FEEDBACK_CONTRACT } from "./feedbackContract";

describe("late-caffeine demo contracts", () => {
  it("keeps canonical feedback options visible for dashboard previews", () => {
    expect(FEEDBACK_CONTRACT.map((option) => option.internalOutcome)).toEqual([
      "good_call",
      "too_much",
      "not_useful",
      "wrong_timing",
      "remind_earlier",
      "remind_later",
      "misunderstood",
      "dont_mention_again",
    ]);
    expect(feedbackPreviewText(FEEDBACK_CONTRACT[1])).toContain("Too much");
    expect(feedbackPreviewText(FEEDBACK_CONTRACT[1])).toContain("softens");
  });

  it("contains scenario runner fixtures for the important demo states", () => {
    expect(DEMO_SCENARIO_FIXTURES.map((item) => item.scenario)).toEqual([
      "ambient_noise",
      "late_caffeine_first_time",
      "late_caffeine_after_too_much_feedback",
      "late_caffeine_after_good_call_feedback",
      "late_caffeine_after_remind_earlier_feedback",
      "typed_live_fallback",
      "mic_silence",
      "transcription_empty",
      "supabase_unavailable",
      "stale_status",
    ]);
    expect(DEMO_SCENARIO_FIXTURES.every((item) => item.command.includes("late_caffeine_demo"))).toBe(true);
  });

  it("labels fixture state provenance honestly", () => {
    expect(DEMO_STATUS_FIXTURES.first_time_late_caffeine.state_persistence).toBe("simulated");
    expect(DEMO_STATUS_FIXTURES.supabase_unavailable.state_persistence).toBe("unavailable");
    expect(DEMO_STATUS_FIXTURES.ambient_filtered.extracted_events).toEqual([]);
  });
});
