"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import GlobalEffects from "@/components/GlobalEffects";
import { usePathname } from 'next/navigation';
import WorkspaceLinks from '@/components/WorkspaceLinks';

export default function AuthLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <AuthProvider>
      {pathname !== '/login' && <GlobalEffects />}
      <div className="w-full">
        {!['/app', '/login', '/signup', '/forgot-password', '/reset-password', '/oauth/consent'].includes(pathname) && <WorkspaceLinks />}
        {children}
      </div>
    </AuthProvider>
  );
}
