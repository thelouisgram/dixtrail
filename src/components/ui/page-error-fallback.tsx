"use client";

import { ArrowLeft, MapPinOff, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LogoIcon } from "@/components/brand/logo-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LOADING_SURFACE_CLASS } from "@/components/ui/cute-placeholder";
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
        "flex animate-fade-in items-center justify-center",
        compact ? "p-4" : "min-h-[50vh] p-6",
        className
      )}
      role="alert"
    >
      <Card
        className={cn(
          "w-full animate-fade-in-up border border-dashed border-primary/20 bg-accent/30 shadow-sm",
          LOADING_SURFACE_CLASS,
          compact ? "max-w-sm" : "max-w-md"
        )}
      >
        <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
          {!compact ? (
            <Logo href="/dashboard" size="sm" className="mb-1" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <LogoIcon className="h-6 w-6" />
            </div>
          )}

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background/80 ring-1 ring-primary/15">
            <MapPinOff className="h-5 w-5 text-primary/80 animate-gentle-pulse" aria-hidden />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold tracking-tight">
              This page couldn&apos;t load
            </h2>
            <p className="text-sm text-muted-foreground">
              Something went off-trail. Reload to try again, or head back to where you were.
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
              className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Return to dashboard
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
