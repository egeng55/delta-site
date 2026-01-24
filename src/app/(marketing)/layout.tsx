"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import GlobalEffects from "@/components/GlobalEffects";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider enableAuth={false}>
      <GlobalEffects />
      <div className="lg:pl-[140px]">
        {children}
      </div>
    </AuthProvider>
  );
}
