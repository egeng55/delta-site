"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { hasSupabaseConfiguration } from "@/lib/supabase";
import { authRedirect } from "@/lib/authRedirect";
import styles from "./signin.module.css";

export default function LoginPage() {
  const search = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const configured = hasSupabaseConfiguration();
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!configured || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        login(email.trim(), password),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => reject(new Error("timeout")), 15000);
        }),
      ]);
      if (!result.success) {
        setError(
          "Sign-in failed. Check your email and password, or try again later.",
        );
        return;
      }
      // A full navigation lets the server authorize refreshed session cookies.
      window.location.assign(authRedirect(search.get("redirect")));
    } catch {
      setError("Sign-in is unavailable or timed out. Please try again.");
    } finally {
      clearTimeout(timeout);
      lock.current = false;
      setBusy(false);
      setPassword("");
    }
  }
  return (
    <main className={styles.page}>
      <header>
        <Link href="/" className={styles.brand}>
          <Image
            src="/delta-logo.svg"
            alt="Delta"
            width={38}
            height={38}
            priority
          />
          <span>Delta</span>
        </Link>
        <Link href="/">
          Back to Delta <ArrowRight size={16} />
        </Link>
      </header>
      <div className={styles.content}>
        <span className={styles.eyebrow}>
          <LockKeyhole size={14} />
          PRIVATE WORKSPACE
        </span>
        <h1>Welcome back.</h1>
        <p>Sign in to continue to your Delta workspace.</p>
        {!configured ? (
          <div className={styles.unavailable} role="status">
            <h2>Sign-in is not connected here.</h2>
            <p>
              This local checkout is missing its authentication configuration.
              Your credentials cannot be submitted from this page.
            </p>
            <Link href="/observatory-preview">
              Return to the design sandbox <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="signin-email">Email</label>
            <input
              id="signin-email"
              autoComplete="username"
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
            <div className={styles.labelRow}>
              <label htmlFor="signin-password">Password</label>
              <Link href="/forgot-password">Forgot password?</Link>
            </div>
            <div className={styles.password}>
              <input
                id="signin-password"
                autoComplete="current-password"
                type={visible ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
              />
              <button
                type="button"
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
                onClick={() => setVisible((v) => !v)}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            <button className={styles.submit} disabled={busy} type="submit">
              {busy ? "Signing in..." : "Sign in"}
              <ArrowRight size={16} />
            </button>
          </form>
        )}
        <div className={styles.access}>
          Need access? <Link href="/access">Request an invitation</Link>
        </div>
      </div>
      <footer>
        <span>Delta / Personal intelligence</span>
        <Link href="/privacy">Privacy</Link>
      </footer>
    </main>
  );
}
