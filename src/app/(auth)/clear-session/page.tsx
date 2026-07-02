"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/brand/logo";

export default function ClearSessionPage() {
  useEffect(() => {
    void signOut({ callbackUrl: "/login" });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
      <Logo href="/login" size="lg" />
      <p className="text-sm text-muted-foreground">Clearing your session…</p>
    </div>
  );
}
