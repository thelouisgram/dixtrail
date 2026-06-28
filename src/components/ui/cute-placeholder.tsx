import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/** Shared accent surface used while data is loading. */
export const LOADING_SURFACE_CLASS = "border-primary/10 bg-accent/20";

/** True on the first fetch before any cached data exists. */
export function isInitialQueryLoad(isPending: boolean, data: unknown) {
  return isPending && data === undefined;
}

/** True when a keyed query is loading and has nothing to show yet. */
export function isKeyedQueryLoading(active: boolean, isPending: boolean, items: unknown[]) {
  return active && isPending && items.length === 0;
}

export function BouncingDots({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <span
      className={cn("inline-flex items-end gap-1 py-1", className)}
      aria-label="Loading"
      role="status"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "inline-block h-2 w-2 rounded-full animate-soft-bounce",
            inverted ? "bg-primary-foreground/85" : "bg-primary/70"
          )}
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  );
}

export function ShimmerBar({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-block overflow-hidden rounded-md bg-muted/80",
        className
      )}
      aria-hidden
    >
      <span className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </span>
  );
}

export function LoadingHint({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-center text-xs text-muted-foreground animate-gentle-pulse", className)}>
      {children}
    </p>
  );
}

function staggerStyle(index: number, step = 80) {
  return { animationDelay: `${index * step}ms` };
}

interface CuteStatProps {
  loading: boolean;
  value?: number;
  className?: string;
}

export function CuteStat({ loading, value, className }: CuteStatProps) {
  if (loading) {
    return (
      <div className={cn("flex h-9 items-center", className)}>
        <BouncingDots />
      </div>
    );
  }

  return (
    <p className={cn("text-3xl font-bold animate-fade-in-up tabular-nums", className)}>
      {value ?? 0}
    </p>
  );
}

interface CuteCountProps {
  loading: boolean;
  value?: number;
  className?: string;
}

export function CuteCount({ loading, value, className }: CuteCountProps) {
  if (loading) {
    return <ShimmerBar className={cn("h-6 w-8", className)} />;
  }

  return (
    <span className={cn("text-lg font-semibold animate-fade-in-up tabular-nums", className)}>
      {value ?? 0}
    </span>
  );
}

export function RecentActivityPlaceholder() {
  return (
    <div className="space-y-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex animate-fade-in-up items-center justify-between rounded-md border border-dashed border-primary/20 bg-accent/30 p-3"
          style={staggerStyle(i, 100)}
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-52" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
      <LoadingHint>Picking up the latest trail markers…</LoadingHint>
    </div>
  );
}

export function UsersTablePlaceholder() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <tr
          key={i}
          className="animate-fade-in-up border-b bg-accent/10"
          style={staggerStyle(i)}
          aria-hidden
        >
          <td className="px-4 py-3">
            <ShimmerBar className="h-5 w-5" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-28" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-40" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-6 w-20 rounded-full" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-24" />
          </td>
          <td className="px-4 py-3">
            <div className="flex justify-end">
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </td>
        </tr>
      ))}
      <tr aria-hidden>
        <td colSpan={6} className="px-4 py-4 text-center">
          <LoadingHint>Rounding up the team…</LoadingHint>
        </td>
      </tr>
    </>
  );
}

export function LocationsTablePlaceholder() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <tr
          key={i}
          className="animate-fade-in-up border-b bg-accent/10"
          style={staggerStyle(i)}
          aria-hidden
        >
          <td className="px-4 py-3">
            <ShimmerBar className="h-5 w-5" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-32" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-36" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-8 w-28 rounded-md" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-16" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-24" />
          </td>
          <td className="px-4 py-3">
            <div className="flex justify-end">
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </td>
        </tr>
      ))}
      <tr aria-hidden>
        <td colSpan={7} className="px-4 py-4 text-center">
          <LoadingHint>Plotting locations on the map…</LoadingHint>
        </td>
      </tr>
    </>
  );
}

export function TerritoriesListPlaceholder() {
  return (
    <div className="space-y-4" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "animate-fade-in-up rounded-md border border-dashed border-primary/20 p-4",
            LOADING_SURFACE_CLASS
          )}
          style={staggerStyle(i, 100)}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      ))}
      <LoadingHint>Mapping out territories…</LoadingHint>
    </div>
  );
}

export function NotificationsListPlaceholder() {
  return (
    <ul className="divide-y" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <li
          key={i}
          className="flex animate-fade-in-up items-start gap-4 px-4 py-4"
          style={staggerStyle(i, 60)}
        >
          <Skeleton className="h-5 w-5 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full" />
        </li>
      ))}
      <li className="px-4 py-6 text-center">
        <LoadingHint>Checking for new notifications…</LoadingHint>
      </li>
    </ul>
  );
}

export function CheckboxListPlaceholder({ rows = 6 }: { rows?: number }) {
  return (
    <div
      className="max-h-60 space-y-3 overflow-hidden rounded-md border border-dashed border-primary/20 bg-accent/20 p-3"
      aria-hidden
    >
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex animate-fade-in-up items-center gap-2" style={staggerStyle(i, 50)}>
          <Skeleton className="size-4 rounded" />
          <Skeleton className="h-4 w-full max-w-xs" />
        </div>
      ))}
      <LoadingHint className="pt-2">Loading cities…</LoadingHint>
    </div>
  );
}

export function CompactListPlaceholder({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 border-t pt-2" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex animate-fade-in-up items-center justify-between"
          style={staggerStyle(i, 45)}
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
      <LoadingHint>Loading…</LoadingHint>
    </div>
  );
}

export function DialogFormPlaceholder() {
  return (
    <div className="space-y-4 py-2" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2 animate-fade-in-up" style={staggerStyle(i, 70)}>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <Skeleton className="h-10 w-full rounded-md" />
      <LoadingHint>Loading details…</LoadingHint>
    </div>
  );
}

export function UserDetailPlaceholder() {
  return (
    <div className="space-y-6 py-2" aria-hidden>
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="space-y-2 animate-fade-in-up" style={staggerStyle(i, 80)}>
          <Skeleton className="h-4 w-36" />
          <div className="space-y-2 rounded-md border border-dashed border-primary/15 p-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
      <LoadingHint>Loading user profile…</LoadingHint>
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ icon, title, description, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-16 text-center", className)}>
      {icon}
      <p className="text-muted-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
