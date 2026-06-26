"use client";

import { useEffect } from "react";
import { PageErrorFallback } from "@/components/ui/page-error-fallback";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}

export function RouteError({ error, reset, unstable_retry }: RouteErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const retry = unstable_retry ?? reset;

  return <PageErrorFallback onRetry={retry} />;
}
