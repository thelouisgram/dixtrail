import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function BouncingDots({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-end gap-1 py-1", className)}
      aria-label="Loading"
      role="status"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-2 w-2 rounded-full bg-primary/70 animate-bounce"
          style={{ animationDelay: `${i * 120}ms`, animationDuration: "0.9s" }}
        />
      ))}
    </span>
  );
}

export function ShimmerBar({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-block overflow-hidden rounded-md bg-muted",
        className
      )}
      aria-hidden
    >
      <span className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </span>
  );
}

interface CuteStatProps {
  loading: boolean;
  value?: number;
  className?: string;
}

/** Stat number with shimmer dots while loading, soft pop-in when ready. */
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

/** Smaller inline count for badges / pipeline rows. */
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
          className="flex items-center justify-between rounded-md border border-dashed border-primary/20 bg-accent/30 p-3"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-52" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
      <p className="text-center text-xs text-muted-foreground animate-pulse">
        Picking up the latest trail markers…
      </p>
    </div>
  );
}

export function UsersTablePlaceholder() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <tr
          key={i}
          className="border-b bg-accent/10"
          style={{ animationDelay: `${i * 80}ms` }}
          aria-hidden
        >
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
            <ShimmerBar className="h-5 w-6" />
          </td>
          <td className="px-4 py-3">
            <ShimmerBar className="h-5 w-6" />
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
          <p className="text-xs text-muted-foreground animate-pulse">
            Rounding up the team…
          </p>
        </td>
      </tr>
    </>
  );
}
