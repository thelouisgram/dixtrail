"use client";

import { useQuery } from "@tanstack/react-query";
import type { DashboardData } from "@/types";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async (): Promise<DashboardData> => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
  });
}
