import { readFileSync } from "fs";
import path from "path";

describe("Bedroom Copilot dashboard live mic fields", () => {
  it("keeps live input source, transcription status, and state provenance visible in the cockpit", () => {
    const source = readFileSync(path.join(process.cwd(), "src/app/(auth)/dashboard/page.tsx"), "utf8");
    const fixtureSource = readFileSync(path.join(process.cwd(), "src/lib/demoFixtures.ts"), "utf8");
    const feedbackSource = readFileSync(path.join(process.cwd(), "src/lib/feedbackContract.ts"), "utf8");

    expect(source).toContain("Input Source");
    expect(source).toContain("Transcription");
    expect(source).toContain("input_source");
    expect(source).toContain("transcription_status");
    expect(source).toContain('inferredMode.includes("dry-run")');
    expect(source).toContain("Late-Caffeine State Inspector");
    expect(source).toContain("State Source");
    expect(source).toContain("state_persistence");
    expect(source).toContain("Simulated dry-run learning");
    expect(source).toContain("Supabase persisted state");
    expect(source).toContain("Delta Bedroom Copilot / Behavioral OS");
    expect(source).toContain("Pipeline Timeline");
    expect(source).toContain("Scenario Runner");
    expect(source).toContain("Scenario Runner Commands");
    expect(source).toContain("Feedback Preview");
    expect(source).toContain("Local demo cockpit is read-only");
    expect(source).toContain("No behavioral event extracted");
    expect(source).toContain("State provenance warnings");
    expect(source).toContain("Persisted Supabase state unavailable. Showing simulated local demo/status state.");
    expect(source).toContain("Product Demo Sequence");
    expect(source).toContain("product_demo_summary");
    expect(source).toContain("one-command product demo");
    expect(fixtureSource).toContain("mic_silence");
    expect(fixtureSource).toContain("transcription_empty");
    expect(fixtureSource).toContain("supabase_unavailable");
    expect(fixtureSource).toContain("stale_status");
    expect(feedbackSource).toContain("You misunderstood me");
    expect(feedbackSource).toContain("Don't mention this again");
    expect(source).toContain("No product demo sequence summary yet");
    expect(source).toContain("Still unproven");
    expect(source).toContain("Audio Diagnostics");
    expect(source).toContain("VAD threshold");
    expect(source).toContain("Min speech seconds");
    expect(source).toContain("Silence timeout");
    expect(source).toContain("RMS Max");
    expect(source).toContain("Debug WAV");
    expect(source).toContain("audio_diagnostics");
  });
});
