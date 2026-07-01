"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NOTIFICATIONS_REFETCH_MS } from "@/lib/query-config";
import type { NotificationsData } from "@/types";

const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;
const NOTIFICATIONS_FETCH_LIMIT = 50;

export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: async (): Promise<NotificationsData> => {
      const res = await fetch(`/api/notifications?limit=${NOTIFICATIONS_FETCH_LIMIT}`);
      if (!res.ok) {
        return { notifications: [], unreadCount: 0 };
      }
      return res.json();
    },
    refetchInterval: NOTIFICATIONS_REFETCH_MS,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id?: string; markAll?: boolean }) => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update notification");
      return json;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const previous = queryClient.getQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY);

      queryClient.setQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY, (old) => {
        if (!old) return old;
        if (input.markAll) {
          return {
            notifications: old.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
          };
        }
        if (input.id) {
          const wasUnread = old.notifications.find((n) => n.id === input.id && !n.read);
          return {
            notifications: old.notifications.map((n) =>
              n.id === input.id ? { ...n, read: true } : n
            ),
            unreadCount: wasUnread ? Math.max(0, old.unreadCount - 1) : old.unreadCount,
          };
        }
        return old;
      });

      return { previous };
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context?.previous);
    },
  });
}
