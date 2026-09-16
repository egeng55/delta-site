"use client";

import { useRef, useState } from "react";
import { requestJson } from "@/lib/requestJson";

type FormStatus = "idle" | "submitting" | "submitted" | "error";

export default function AccessRequestForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState("");
  const inFlight = useRef(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus("submitting");
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await requestJson("/api/access-requests", {
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
      inFlight.current = false;
      setError(
        "We could not confirm your request. Your entries are preserved. Submitting again will not create a second request for the same email.",
      );
      setStatus("error");
      return;
    }

    if (
      !response.ok ||
      response.status !== 202 ||
      !response.data ||
      typeof response.data !== "object" ||
      Reflect.get(response.data, "accepted") !== true
    ) {
      inFlight.current = false;
      setError(
        response.status === 429
          ? "Too many requests. Please wait before trying again."
          : "Could not confirm your request. Please check your entries and try again later.",
      );
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
    <form
      onSubmit={handleSubmit}
      aria-label="Request access"
      aria-busy={status === "submitting"}
      className="mt-8 space-y-5"
    >
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
        <label
          htmlFor="access-email"
          className="mb-2 block text-sm font-medium"
        >
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
        <label
          htmlFor="access-reason"
          className="mb-2 block text-sm font-medium"
        >
          What would you like to explore?{" "}
          <span className="text-muted">(optional)</span>
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
        <input
          id="access-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
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
        to an invitation. See the{" "}
        <a href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </a>{" "}
        for data controls. No approval or response time is promised.
      </p>
    </form>
  );
}
