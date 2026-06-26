"use client";

import { useEffect } from "react";
import { PageErrorFallback } from "@/components/ui/page-error-fallback";
import "./globals.css";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}

export default function GlobalError({ error, reset, unstable_retry }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const retry = unstable_retry ?? reset;

  return (
    <html lang="en">
      <body className="min-h-full bg-background antialiased">
        <PageErrorFallback onRetry={retry} className="min-h-screen" />
      </body>
    </html>
  );
}
