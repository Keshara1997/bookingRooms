"use client";

import { useEffect } from "react";

import { hydrateSession } from "@/lib/session";

export function DashboardSession({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    hydrateSession();
  }, []);

  return <>{children}</>;
}