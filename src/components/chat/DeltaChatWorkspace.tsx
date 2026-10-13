"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUp,
  BookOpenText,
  Menu,
  MessageSquareText,
  Plus,
  Settings,
  ShieldCheck,
  Square,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import styles from "./delta-chat.module.css";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const starters = [
  "Help me decide what deserves attention today.",
  "Research a question and keep the evidence attached.",
  "Think through a project without losing the larger context.",
] as const;

function messageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function DeltaChatWorkspace() {
  const { user, session, isLoading, logout } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const transcript = useRef<HTMLDivElement>(null);

  const accountLabel = useMemo(
    () => user?.name?.split(" ")[0] || user?.username || "Your account",
    [user?.name, user?.username],
  );

  useEffect(() => {
    if (typeof transcript.current?.scrollTo === "function") {
      transcript.current.scrollTo({
        top: transcript.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, busy]);

  useEffect(() => () => controller.current?.abort(), []);

  async function sendMessage(value = input) {
    const text = value.trim();
    if (!text || busy || !session?.access_token) return;

    const userMessage: ChatMessage = {
      id: messageId(),
      role: "user",
      content: text,
    };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError("");
    setBusy(true);
    const abortController = new AbortController();
    controller.current = abortController;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          client_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
        signal: abortController.signal,
      });
      const payload = (await response.json().catch(() => ({}))) as {
        response?: unknown;
      };
      if (!response.ok || typeof payload.response !== "string") {
        throw new Error("chat_unavailable");
      }
      const responseText = payload.response;
      setMessages((current) => [
        ...current,
        { id: messageId(), role: "assistant", content: responseText },
      ]);
    } catch (requestError) {
      if ((requestError as Error).name !== "AbortError") {
        setError(
          "Delta could not confirm a response. Your message was not resubmitted automatically.",
        );
      }
    } finally {
      if (controller.current === abortController) controller.current = null;
      setBusy(false);
    }
  }

  function resetConversation() {
    controller.current?.abort();
    controller.current = null;
    setMessages([]);
    setInput("");
    setError("");
    setBusy(false);
    setSidebarOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  if (isLoading) {
    return (
      <main className={styles.loading}>
        <Image src="/delta-logo.svg" alt="" width={52} height={52} priority />
        <p>Opening your Delta workspace...</p>
      </main>
    );
  }

  return (
    <main className={styles.workspace}>
      {sidebarOpen && (
        <button
          className={styles.scrim}
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.brand} aria-label="Delta home">
            <Image src="/delta-logo.svg" alt="" width={34} height={34} priority />
            <span>Delta</span>
          </Link>
          <button
            className={styles.mobileClose}
            type="button"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <button className={styles.newChat} type="button" onClick={resetConversation}>
          <Plus size={17} />
          New conversation
        </button>
        <nav className={styles.appNav} aria-label="Delta workspace">
          <span>Workspace</span>
          <Link href="/app" aria-current="page">
            <MessageSquareText size={17} />
            Chat
          </Link>
          <Link href="/command">
            <BookOpenText size={17} />
            Connections
          </Link>
          <Link href="/account">
            <UserRound size={17} />
            Account
          </Link>
          <Link href="/settings">
            <Settings size={17} />
            Settings
          </Link>
        </nav>
        <div className={styles.sidebarNote}>
          <ShieldCheck size={16} />
          <p>
            This conversation uses the context available to the authenticated
            account. Actions keep their own approval boundary.
          </p>
        </div>
        <div className={styles.accountRow}>
          <span>{accountLabel.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{accountLabel}</strong>
            <small>Private account</small>
          </div>
          <button type="button" onClick={() => void logout()}>
            Sign out
          </button>
        </div>
      </aside>

      <section className={styles.conversation}>
        <header className={styles.conversationHeader}>
          <button
            className={styles.mobileMenu}
            type="button"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={19} />
          </button>
          <div>
            <strong>Conversation</strong>
            <span>Account context</span>
          </div>
          <Link href="/account" aria-label="Open account">
            {accountLabel.slice(0, 1).toUpperCase()}
          </Link>
        </header>

        <div className={styles.transcript} ref={transcript} aria-live="polite">
          {messages.length === 0 ? (
            <div className={styles.emptyState}>
              <Image src="/delta-logo.svg" alt="" width={58} height={58} />
              <p className={styles.overline}>DELTA</p>
              <h1>What should we work through?</h1>
              <p>
                Start a private conversation. Delta can use the context already
                attached to this account, while keeping uncertain or unavailable
                information explicit.
              </p>
              <div className={styles.starters}>
                {starters.map((starter) => (
                  <button
                    type="button"
                    key={starter}
                    onClick={() => void sendMessage(starter)}
                  >
                    {starter}
                    <ArrowUp size={15} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.messageList}>
              {messages.map((message) => (
                <article key={message.id} className={styles[message.role]}>
                  <span>{message.role === "assistant" ? "DELTA" : "YOU"}</span>
                  <p>{message.content}</p>
                </article>
              ))}
              {busy && (
                <article className={styles.assistant}>
                  <span>DELTA</span>
                  <p className={styles.thinking}>Considering the context...</p>
                </article>
              )}
            </div>
          )}
        </div>

        <div className={styles.composerArea}>
          {error && <p role="alert" className={styles.error}>{error}</p>}
          <div className={styles.composer}>
            <label className={styles.srOnly} htmlFor="delta-message">
              Message Delta
            </label>
            <textarea
              id="delta-message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Delta"
              rows={1}
              maxLength={12000}
              disabled={busy || !session?.access_token}
            />
            {busy ? (
              <button
                type="button"
                aria-label="Stop response"
                onClick={() => controller.current?.abort()}
              >
                <Square size={15} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Send message"
                disabled={!input.trim() || !session?.access_token}
                onClick={() => void sendMessage()}
              >
                <ArrowUp size={18} />
              </button>
            )}
          </div>
          <p className={styles.composerNote}>
            Delta can make mistakes. Verify important decisions and approve actions separately.
          </p>
        </div>
      </section>

      <aside className={styles.contextPanel}>
        <p className={styles.contextLabel}>Current boundary</p>
        <h2>Account-scoped context</h2>
        <dl>
          <div>
            <dt>Identity</dt>
            <dd>Authenticated account</dd>
          </div>
          <div>
            <dt>Conversation</dt>
            <dd>Current session</dd>
          </div>
          <div>
            <dt>External actions</dt>
            <dd>Separate approval required</dd>
          </div>
        </dl>
        <div className={styles.contextNotice}>
          <ShieldCheck size={17} />
          <p>
            Delta may use account context across sessions. This preview does not
            yet restore prior transcripts inside the web interface.
          </p>
        </div>
        <Link href="/security">How the boundary works</Link>
      </aside>
    </main>
  );
}
