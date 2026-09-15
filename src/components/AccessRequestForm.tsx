"use client";

import { useState } from "react";

type FormStatus = "idle" | "submitting" | "submitted" | "error";

export default function AccessRequestForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/access-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        reason: formData.get("reason"),
        company: formData.get("company"),
      }),
    }).catch(() => null);

    if (!response) {
      setError("Access requests are temporarily unavailable.");
      setStatus("error");
      return;
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(typeof payload.error === "string" ? payload.error : "Could not submit request.");
      setStatus("error");
      return;
    }

    form.reset();
    setStatus("submitted");
  }

  if (status === "submitted") {
    return (
      <div aria-live="polite" className="mt-8 border-y border-border py-6">
        <h2 className="text-lg font-semibold">Request submitted</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Your request is recorded for manual review. Submission does not create
          an account or guarantee approval.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="access-name" className="mb-2 block text-sm font-medium">
          Name
        </label>
        <input
          id="access-name"
          name="name"
          type="text"
          autoComplete="name"
          minLength={2}
          maxLength={120}
          required
          className="w-full border border-border bg-background px-4 py-3 outline-none focus:border-primary"
        />
      </div>

      <div>
        <label htmlFor="access-email" className="mb-2 block text-sm font-medium">
          Email
        </label>
        <input
          id="access-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          className="w-full border border-border bg-background px-4 py-3 outline-none focus:border-primary"
        />
      </div>

      <div>
        <label htmlFor="access-reason" className="mb-2 block text-sm font-medium">
          What would you like to explore? <span className="text-muted">(optional)</span>
        </label>
        <textarea
          id="access-reason"
          name="reason"
          rows={4}
          maxLength={1200}
          className="w-full resize-y border border-border bg-background px-4 py-3 outline-none focus:border-primary"
        />
      </div>

      <div className="absolute left-[-10000px]" aria-hidden="true">
        <label htmlFor="access-company">Company</label>
        <input id="access-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full bg-foreground px-5 py-3 text-sm font-medium text-background disabled:opacity-60"
      >
        {status === "submitting" ? "Submitting…" : "Submit access request"}
      </button>

      <p className="text-xs leading-5 text-muted">
        Delta stores this request so it can be reviewed and, if approved, linked
        to an invitation. See the <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> for
        data controls. No approval or response time is promised.
      </p>
    </form>
  );
}
