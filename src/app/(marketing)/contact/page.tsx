"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  Arrow,
  PageIntro,
  PublicSite,
  styles,
} from "@/components/public/PublicSite";
import { DELTA_API_URL } from "@/lib/api";
import { requestJson } from "@/lib/requestJson";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    if (form.message.trim().length < 10) {
      setError("Please enter at least 10 characters in your message.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    inFlight.current = true;
    setError("");
    try {
      const response = await requestJson(`${DELTA_API_URL}/support/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: `web-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          subject: form.subject,
          message: form.message,
          user_email: form.email,
          metadata: { name: form.name, source: "website", page: "/contact" },
        }),
      });
      if (!response.ok) {
        setError(
          response.status === 429
            ? "Too many requests. Please wait before trying again."
            : "Your message was not sent. Please try again or email us directly.",
        );
        setStatus("error");
        return;
      }
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setError(
        "We could not confirm delivery. Please email us directly if this continues.",
      );
      setStatus("error");
    } finally {
      inFlight.current = false;
    }
  }
  return (
    <PublicSite>
      <main id="main">
        <PageIntro
          label="Contact"
          title="What would you like Delta to understand?"
          atmosphere="/images/atmosphere/willow-water.jpg"
          atmospherePosition="center 44%"
        >
          <p>
            Questions, thoughtful feedback, and conversations about the system
            are welcome. For preview access, use the dedicated request form.
          </p>
        </PageIntro>
        <section
          className={`${styles.container} ${styles.section} ${styles.twoColumns}`}
        >
          <div>
            <h2>Let&apos;s talk.</h2>
            <p>
              <a className={styles.textLink} href="mailto:eric@egeng.co">
                eric@egeng.co <Arrow />
              </a>
            </p>
            <p>
              Ann Arbor, Michigan
              <br />
              Replies are handled personally.
            </p>
            <Link href="/signup" className={styles.textLink}>
              Request preview access <Arrow />
            </Link>
            <p>
              Please do not include passwords, private health records, or other
              sensitive information in your message.
            </p>
          </div>
          <div>
            {status === "success" ? (
              <div className={styles.success} role="status">
                <h2>Message received.</h2>
                <p>
                  Thank you for getting in touch. We&apos;ll review your
                  message.
                </p>
                <button
                  className={styles.outlineButton}
                  onClick={() => setStatus("idle")}
                >
                  Send another message <Arrow />
                </button>
              </div>
            ) : (
              <form
                className={styles.form}
                onSubmit={submit}
                aria-label="Contact Delta"
                aria-busy={status === "loading"}
              >
                <div className={styles.formRow}>
                  <label>
                    Name
                    <input
                      name="name"
                      autoComplete="name"
                      required
                      maxLength={200}
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Email
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                  </label>
                </div>
                <label>
                  Subject
                  <input
                    name="subject"
                    required
                    maxLength={200}
                    value={form.subject}
                    onChange={(e) =>
                      setForm({ ...form, subject: e.target.value })
                    }
                  />
                </label>
                <label>
                  Message
                  <textarea
                    name="message"
                    required
                    minLength={10}
                    maxLength={5000}
                    rows={6}
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    aria-describedby="contact-guidance"
                  />
                </label>
                <p id="contact-guidance">
                  No sensitive information. Maximum 5,000 characters.
                </p>
                {status === "error" && (
                  <p className={styles.formError} role="alert">
                    {error}
                  </p>
                )}
                <button
                  className={styles.darkButton}
                  type="submit"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Sending..." : "Send message"}{" "}
                  <Arrow />
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
    </PublicSite>
  );
}
