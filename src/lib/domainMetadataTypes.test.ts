import {
  formatDomainLifecycleStage,
  formatDomainPrivacyLevel,
  formatFeedbackCapability,
  normalizeDomainMetadata,
  normalizeDomainRegistryResponse,
} from "./domainMetadataTypes";

function lateCaffeinePayload() {
  return {
    domain_id: "late_caffeine",
    name: "Late Caffeine",
    description: "Detects late caffeine and adapts timing, tone, cooldown, and suppression from feedback.",
    lifecycle_stage: "proof_backed",
    privacy_level: "high",
    event_types: ["caffeine", "late_caffeine_intake"],
    state_fields: ["tone", "cooldown_minutes"],
    prediction_types: ["sleep_risk"],
    intervention_types: ["notify", "defer"],
    feedback_capabilities: ["good_call", "too_much", "not_useful", "wrong_timing"],
    storage_policy: "Persisted in behavioral_loop_state with explicit provenance.",
    readiness_requirements: ["event extraction handles caffeine"],
    eval_requirements: ["positive late-caffeine event"],
    proof_requirements: ["feedback changes future behavior"],
    notes: ["First proof-backed Behavioral OS domain."],
    introspection_mode: "read_only_metadata",
  };
}

describe("domain metadata contract normalization", () => {
  it("normalizes backend domain registry metadata", () => {
    const normalized = normalizeDomainRegistryResponse({
      domains: [lateCaffeinePayload()],
      domain_count: 1,
      introspection_mode: "read_only_metadata",
      user_state_included: false,
      side_effects: {
        supabase: false,
        memory_writes: false,
        notifications: false,
        tts: false,
        live_mic: false,
      },
    });

    expect(normalized).not.toBeNull();
    expect(normalized?.domain_count).toBe(1);
    expect(normalized?.domains[0].domain_id).toBe("late_caffeine");
    expect(normalized?.domains[0].feedback_capabilities).toContain("good_call");
    expect(normalized?.side_effects.supabase).toBe(false);
  });

  it("returns null for malformed registry payloads", () => {
    expect(normalizeDomainRegistryResponse(null)).toBeNull();
    expect(normalizeDomainRegistryResponse({})).toBeNull();
    expect(normalizeDomainRegistryResponse({ domains: "late_caffeine" })).toBeNull();
  });

  it("drops malformed domain entries without throwing", () => {
    const normalized = normalizeDomainRegistryResponse({
      domains: [lateCaffeinePayload(), { name: "Missing id" }, null],
      side_effects: {},
    });

    expect(normalized?.domains).toHaveLength(1);
    expect(normalized?.domains[0].domain_id).toBe("late_caffeine");
    expect(normalized?.domain_count).toBe(1);
  });

  it("fills safe defaults for missing optional metadata fields", () => {
    const normalized = normalizeDomainMetadata({
      domain_id: "focus_routine",
      feedback_capabilities: ["good_call", 123, ""],
      readiness_requirements: "not an array",
      side_effects: { supabase: true },
    });

    expect(normalized).toEqual(expect.objectContaining({
      domain_id: "focus_routine",
      name: "Focus Routine",
      description: "",
      lifecycle_stage: "unknown",
      privacy_level: "unknown",
      feedback_capabilities: ["good_call"],
      readiness_requirements: [],
      proof_requirements: [],
      eval_requirements: [],
      introspection_mode: "unknown",
    }));
  });

  it("defaults side-effect flags to false when they are missing or malformed", () => {
    const normalized = normalizeDomainRegistryResponse({
      domains: [lateCaffeinePayload()],
      side_effects: {
        supabase: "false",
        notifications: true,
      },
    });

    expect(normalized?.side_effects).toEqual({
      supabase: false,
      memory_writes: false,
      notifications: true,
      tts: false,
      live_mic: false,
    });
  });

  it("formats lifecycle, privacy, and feedback labels for display", () => {
    expect(formatDomainLifecycleStage("proof_backed")).toBe("Proof Backed");
    expect(formatDomainLifecycleStage("local-demo")).toBe("Local Demo");
    expect(formatDomainPrivacyLevel("high")).toBe("High - sleep, caffeine, and routine behavior");
    expect(formatDomainPrivacyLevel("future_level")).toBe("Future Level");
    expect(formatFeedbackCapability("remind_later")).toBe("remind later");
    expect(formatFeedbackCapability("custom_option")).toBe("custom option");
  });
});
