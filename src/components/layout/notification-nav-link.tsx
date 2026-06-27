"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

interface NotificationNavLinkProps {
  href?: string;
  className?: string;
  active?: boolean;
  showLabel?: boolean;
  onClick?: () => void;
}

export function NotificationNavLink({
  href = "/dashboard/notifications",
  className,
  active = false,
  showLabel = true,
  onClick,
}: NotificationNavLinkProps) {
  const { data } = useNotifications();
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        className
      )}
      aria-label={`Notifications${unreadCount ? `, ${unreadCount} unseen` : ""}`}
    >
      <span className="relative shrink-0">
        <Bell className="h-4 w-4" />
        {!showLabel && unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </span>
      {showLabel && (
        <>
          <span className="flex-1">Notifications</span>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold leading-none text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </>
      )}
    </Link>
  );
}
