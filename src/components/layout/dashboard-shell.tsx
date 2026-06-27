"use client";

import { ErrorBoundary } from "@/components/error-boundary";
import { Sidebar } from "@/components/layout/sidebar";
import { PageErrorFallback } from "@/components/ui/page-error-fallback";

interface DashboardShellProps {
  userRole: string;
  userName?: string | null;
  children: React.ReactNode;
}

export function DashboardShell({ userRole, userName, children }: DashboardShellProps) {
  return (
    <div className="flex h-screen min-h-screen overflow-hidden">
      <ErrorBoundary
        fallback={(_error, reset) => (
          <aside className="flex h-screen min-h-screen w-72 max-w-[85vw] shrink-0 flex-col border-r bg-card lg:w-64">
            <div className="flex flex-1 items-center p-4">
              <PageErrorFallback compact onRetry={reset} className="min-h-0 w-full" />
            </div>
          </aside>
        )}
      >
        <Sidebar userRole={userRole} userName={userName} />
      </ErrorBoundary>
      <main className="min-h-0 flex-1 overflow-y-auto p-4 pt-[4.5rem] sm:p-6 lg:p-8 lg:pt-6">
        {children}
      </main>
    </div>
  );
}
