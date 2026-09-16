"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen px-6 pt-28">
      <h1 className="text-2xl font-semibold">This page couldn’t load</h1>
      <p className="my-4" role="alert">Please try loading the page again. Check recent activity before repeating a submission.</p>
      <button type="button" onClick={reset} className="rounded border px-4 py-2">Reload page</button>
    </main>
  );
}
