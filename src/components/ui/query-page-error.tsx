"use client";

import { PageErrorFallback } from "@/components/ui/page-error-fallback";

interface QueryPageErrorProps {
  isError: boolean;
  refetch: () => void;
  children: React.ReactNode;
}

export function QueryPageError({ isError, refetch, children }: QueryPageErrorProps) {
  if (isError) {
    return <PageErrorFallback onRetry={() => refetch()} />;
  }

  return children;
}
