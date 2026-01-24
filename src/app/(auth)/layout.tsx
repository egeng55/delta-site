import type { ReactNode } from "react";
import AuthLayoutClient from "./AuthLayoutClient";

// Force dynamic rendering for all auth pages - they require authentication
export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthLayoutClient>{children}</AuthLayoutClient>;
}

