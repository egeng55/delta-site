"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import GlobalEffects from "@/components/GlobalEffects";

export default function AuthLayoutClient({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <GlobalEffects />
      <div className="w-full">
        {children}
      </div>
    </AuthProvider>
  );
}
