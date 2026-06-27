import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description: string;
  loadingDescription?: string;
  isLoading?: boolean;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  loadingDescription,
  isLoading = false,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up",
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">
          {isLoading && loadingDescription ? loadingDescription : description}
        </p>
      </div>
      {action}
    </div>
  );
}
