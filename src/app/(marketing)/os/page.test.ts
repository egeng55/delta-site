import { readFileSync } from "fs";
import path from "path";

describe("Delta OS Console page", () => {
  it("defines the OS Console route and product cockpit shell", () => {
    const pageSource = readFileSync(path.join(process.cwd(), "src/app/(marketing)/os/page.tsx"), "utf8");
    const consoleSource = readFileSync(path.join(process.cwd(), "src/components/OSConsole.tsx"), "utf8");
    const fixtureSource = readFileSync(path.join(process.cwd(), "src/lib/osConsoleFixtures.ts"), "utf8");

    expect(pageSource).toContain("Delta OS Console");
    expect(pageSource).toContain("Local Behavioral OS and conversation runtime cockpit.");
    expect(pageSource).toContain("<OSConsole />");

    expect(consoleSource).toContain("Conversation");
    expect(consoleSource).toContain("Behavioral State");
    expect(consoleSource).toContain("Voice Runtime");
    expect(consoleSource).toContain("Recent Interventions");
    expect(consoleSource).toContain("Safety Gates");
    expect(consoleSource).toContain("Proof Ladder");
    expect(consoleSource).toContain("Next Safe Action");
    expect(consoleSource).toContain("fallback fixture");
    expect(consoleSource).toContain("backend status unavailable");
    expect(consoleSource).toContain("read-only API");
    expect(consoleSource).toContain("askDeltaConversation");
    expect(consoleSource).toContain("Voice input coming soon");
    expect(consoleSource).toContain("Speak response pending validation");
    expect(consoleSource).toContain("Clear session");
    expect(consoleSource).toContain("Refresh OS State");
    expect(consoleSource).toContain("Live System Readiness");
    expect(consoleSource).toContain("Refresh readiness");
    expect(consoleSource).toContain("Can Delta run safely right now?");
    expect(consoleSource).toContain("terminal_only");
    expect(consoleSource).toContain("Browser voice controls");
    expect(consoleSource).toContain("Start backend");
    expect(consoleSource).toContain("Validate typed conversation API");
    expect(consoleSource).toContain("no automatic memory writes");
    expect(consoleSource).toContain("no always-on listening");
    expect(consoleSource).toContain("Backend conversation unavailable");

    expect(fixtureSource).toContain("Live mic + TTS conversation");
    expect(fixtureSource).toContain("pending validation");
    expect(fixtureSource).toContain("Always-on");
    expect(fixtureSource).toContain("not built");
    expect(fixtureSource).toContain("Wake word");
    expect(fixtureSource).toContain("not built");
    expect(fixtureSource).toContain("ENABLE_LOCAL_TTS=true");
    expect(fixtureSource).toContain("--tts");
    expect(fixtureSource).toContain("desktop_notification");
    expect(fixtureSource).toContain("too_much");
    expect(fixtureSource).toContain("remind_earlier");
  });

  it("does not overclaim unsupported runtime capabilities", () => {
    const consoleSource = readFileSync(path.join(process.cwd(), "src/components/OSConsole.tsx"), "utf8");
    const fixtureSource = readFileSync(path.join(process.cwd(), "src/lib/osConsoleFixtures.ts"), "utf8");

    expect(consoleSource).not.toContain("production ready");
    expect(consoleSource).not.toContain("always-on assistant");
    expect(fixtureSource).not.toContain("production ready");
    expect(fixtureSource).not.toContain("fully autonomous");
  });
});
