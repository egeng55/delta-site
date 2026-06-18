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
    expect(consoleSource).toContain("System context");
    expect(consoleSource).toContain("Current pattern");
    expect(consoleSource).toContain("State");
    expect(consoleSource).toContain("Readiness");
    expect(consoleSource).toContain("Proof");
    expect(consoleSource).toContain("Safety");
    expect(consoleSource).toContain("Live readiness");
    expect(consoleSource).toContain("Safety posture");
    expect(consoleSource).toContain("Full proof ladder");
    expect(consoleSource).toContain("Developer tools");
    expect(consoleSource).toContain("Developer Commands");
    expect(consoleSource).toContain("fallback fixture");
    expect(consoleSource).toContain("backend status unavailable");
    expect(consoleSource).toContain("read-only API");
    expect(consoleSource).toContain("askDeltaConversation");
    expect(consoleSource).toContain("Voice input coming soon");
    expect(consoleSource).toContain("Speak response");
    expect(consoleSource).toContain("Browser TTS unavailable");
    expect(consoleSource).toContain("local browser playback only");
    expect(consoleSource).toContain("no backend TTS");
    expect(consoleSource).toContain("Clear session");
    expect(consoleSource).toContain("Command Palette");
    expect(consoleSource).toContain("Session Intelligence");
    expect(consoleSource).toContain("Copy Proof Report");
    expect(consoleSource).toContain("Recommended Next Step");
    expect(consoleSource).toContain("Suggested follow-ups");
    expect(consoleSource).toContain("Refresh OS State");
    expect(consoleSource).toContain("terminal_only");
    expect(consoleSource).toContain("Voice input");
    expect(consoleSource).toContain("Start backend");
    expect(consoleSource).toContain("Validate typed conversation API");
    expect(consoleSource).toContain("no memory writes");
    expect(consoleSource).toContain("Always-on listening");
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
