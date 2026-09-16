"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ reset }: { reset: () => void }) {
  useEffect(() => {
    console.error(JSON.stringify({ event: "public_page_render_failed" }));
  }, []);
  return (
    <main className="mx-auto min-h-[60vh] max-w-3xl px-6 py-32">
      <h1 className="text-3xl font-semibold">This page could not load.</h1>
      <p role="alert" className="mt-4">
        Please try again. If a submission was interrupted, check its status
        before resubmitting.
      </p>
      <div className="mt-8 flex gap-6">
        <button className="border px-5 py-3" onClick={reset}>
          Try again
        </button>
        <Link className="px-5 py-3 underline" href="/">
          Return home
        </Link>
      </div>
    </main>
  );
}
