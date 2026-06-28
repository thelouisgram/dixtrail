"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bell, Building2, MapPin } from "lucide-react";
import { NotificationType } from "@prisma/client";
import { useNotifications, useMarkNotificationRead } from "@/hooks/use-notifications";
import { notificationHref, notificationTypeLabel } from "@/lib/notifications-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { QueryPageError } from "@/components/ui/query-page-error";
import {
  EmptyState,
  isInitialQueryLoad,
  LOADING_SURFACE_CLASS,
  NotificationsListPlaceholder,
} from "@/components/ui/cute-placeholder";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types";

function NotificationIcon({ type }: { type: NotificationType }) {
  if (type === NotificationType.CITY_ASSIGNED) {
    return <Building2 className="h-5 w-5 shrink-0 text-primary" />;
  }
  return <MapPin className="h-5 w-5 shrink-0 text-primary" />;
}

export function NotificationsPageClient() {
  const router = useRouter();
  const { data, isPending, isError, refetch } = useNotifications({ limit: 50 });
  const markRead = useMarkNotificationRead();

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = data?.notifications ?? [];
  const isFirstLoad = isInitialQueryLoad(isPending, data);

  async function handleNotificationClick(notification: NotificationItem) {
    if (!notification.read) {
      await markRead.mutateAsync({ id: notification.id });
    }
    router.push(notificationHref(notification));
  }

  return (
    <QueryPageError isError={isError} refetch={refetch}>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Notifications"
          description={
            unreadCount > 0
              ? `${unreadCount} unseen notification${unreadCount === 1 ? "" : "s"}`
              : "Assignments and updates for your account"
          }
          loadingDescription="Checking for new notifications…"
          isLoading={isFirstLoad}
          action={
            unreadCount > 0 ? (
              <Button
                variant="outline"
                loading={markRead.isPending}
                onClick={() => markRead.mutate({ markAll: true })}
              >
                Mark all read
              </Button>
            ) : undefined
          }
        />

        <Card className={cn(isFirstLoad && LOADING_SURFACE_CLASS, "animate-fade-in-up")}>
          <CardContent className="p-0">
            {isFirstLoad ? (
              <NotificationsListPlaceholder />
            ) : notifications.length === 0 ? (
              <EmptyState
                icon={<Bell className="h-10 w-10 text-muted-foreground/50" />}
                title="No notifications yet."
                description="You'll be notified when assigned to a location or city."
              />
            ) : (
              <ul className="divide-y">
                {notifications.map((notification, index) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "flex w-full animate-fade-in-up items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-accent/40",
                        !notification.read && "bg-accent/25"
                      )}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <NotificationIcon type={notification.type} />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {notificationTypeLabel(notification.type)}
                        </p>
                        <p className="text-sm leading-snug">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </QueryPageError>
  );
}
