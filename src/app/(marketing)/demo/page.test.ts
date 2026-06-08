import { readFileSync } from "fs";
import path from "path";

describe("Behavioral OS demo page", () => {
  it("explains the proven late-caffeine loop without overclaiming", () => {
    const source = readFileSync(path.join(process.cwd(), "src/app/(marketing)/demo/page.tsx"), "utf8");

    expect(source).toContain("Delta is not just a chatbot");
    expect(source).toContain("late-caffeine observation");
    expect(source).toContain("What is actually proven");
    expect(source).toContain("What is still gated or unproven");
    expect(source).toContain("Current Proof Status");
    expect(source).toContain("Partially proven");
    expect(source).toContain("Not yet proven");
    expect(source).toContain("A narrow product demo, not a production claim");
    expect(source).toContain("Delta can stay silent on ambient input");
    expect(source).toContain("Real spoken-input transcription has not been fully validated");
    expect(source).toContain("Persisted Supabase learning was not verified locally");
    expect(source).toContain("one behavioral domain: late caffeine");
    expect(source).toContain("State provenance matters");
    expect(source).toContain("Feedback UX");
    expect(source).toContain("can help without becoming annoying");
    expect(source).not.toContain("production ready");
  });
});
