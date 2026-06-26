"use client";

import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PageErrorFallbackProps {
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

export function PageErrorFallback({
  onRetry,
  className,
  compact = false,
}: PageErrorFallbackProps) {
  function handleRetry() {
    if (onRetry) {
      onRetry();
      return;
    }
    window.location.reload();
  }

  function handleGoBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.assign("/dashboard");
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        compact ? "p-4" : "min-h-[50vh] p-6",
        className
      )}
      role="alert"
    >
      <Card className={cn("w-full border-destructive/20", compact ? "max-w-sm" : "max-w-md")}>
        <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" aria-hidden />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">This page couldn&apos;t load</h2>
            <p className="text-sm text-muted-foreground">
              Something went wrong. Reload to try again, or go back to where you were.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={handleRetry} className="w-full sm:w-auto">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload
            </Button>
            <Button variant="outline" onClick={handleGoBack} className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go back
            </Button>
          </div>
          {!compact && (
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Return to dashboard
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
