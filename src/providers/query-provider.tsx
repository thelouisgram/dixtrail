"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { PageErrorFallback } from "@/components/ui/page-error-fallback";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary
        fallback={(_error, reset) => (
          <PageErrorFallback onRetry={reset} className="min-h-screen" />
        )}
      >
        {children}
      </ErrorBoundary>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
