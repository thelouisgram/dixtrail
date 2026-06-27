"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NotificationsData } from "@/types";

export function useNotifications(options?: { limit?: number }) {
  const limit = options?.limit ?? 20;
  return useQuery({
    queryKey: ["notifications", limit],
    queryFn: async (): Promise<NotificationsData> => {
      const res = await fetch(`/api/notifications?limit=${limit}`);
      if (!res.ok) {
        return { notifications: [], unreadCount: 0 };
      }
      return res.json();
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
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
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previousEntries = queryClient.getQueriesData<NotificationsData>({
        queryKey: ["notifications"],
      });

      queryClient.setQueriesData<NotificationsData>({ queryKey: ["notifications"] }, (old) => {
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

      return { previousEntries };
    },
    onError: (_err, _input, context) => {
      context?.previousEntries?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
