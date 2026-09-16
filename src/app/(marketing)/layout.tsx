"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider enableAuth={false}>
      <div className="w-full">
        {children}
      </div>
    </AuthProvider>
  );
}
