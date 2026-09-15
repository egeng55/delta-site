import Image from "next/image";
import Link from "next/link";
import AccessRequestForm from "@/components/AccessRequestForm";
import { PUBLIC_ACCESS_POLICY } from "@/lib/publicCapabilityManifest";

export default function SignUpPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-8 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-primary/5" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <Image src="/delta-logo.svg" alt="Delta" width={48} height={48} />
          <span className="text-2xl font-semibold">Delta</span>
        </Link>

        <section className="rounded-3xl border border-border bg-card p-8 shadow-xl">
          <p className="text-sm font-medium text-primary">Private preview</p>
          <h1 className="mt-3 text-3xl font-semibold">Request access to Delta</h1>
          <p className="mt-4 leading-7 text-muted">
            {PUBLIC_ACCESS_POLICY.statement} Approved access covers only the
            current private-preview capabilities, beginning with owner-authorized
            WHOOP context and connection controls.
          </p>

          <div className="mt-8 space-y-3 text-sm leading-6 text-muted">
            <p>Access requests are reviewed manually.</p>
            <p>Submitting a request does not create an account or guarantee approval.</p>
            <p>Proof, research, and internal capabilities are not included in preview access.</p>
          </div>

          <AccessRequestForm />

          <Link
            href="/access"
            className="mt-5 block text-center text-sm text-primary hover:underline"
          >
            Review preview access
          </Link>

          <p className="mt-8 text-center text-sm text-muted">
            Already approved?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
