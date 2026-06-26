"use client";

import { useDashboard } from "@/hooks/use-dashboard";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import { LocationStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Globe, Layers } from "lucide-react";
import {
  CuteStat,
  CuteCount,
  RecentActivityPlaceholder,
} from "@/components/ui/cute-placeholder";

interface DashboardPageClientProps {
  userRole: string;
}

export function DashboardPageClient({ userRole }: DashboardPageClientProps) {
  const { data, isPending } = useDashboard();
  const isAdmin = userRole === "ADMIN" || userRole === "MANAGER";
  const isFirstLoad = isPending && !data;

  const stats = [
    {
      label: "Total Locations",
      value: data?.totalLocations,
      icon: MapPin,
      show: true,
    },
    {
      label: "Team Members",
      value: data?.totalUsers,
      icon: Users,
      show: isAdmin,
    },
    {
      label: "Countries",
      value: data?.totalCountries,
      icon: Globe,
      show: isAdmin,
    },
    {
      label: "States",
      value: data?.totalStates,
      icon: Layers,
      show: isAdmin,
    },
  ].filter((s) => s.show);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {isFirstLoad ? "Warming up your pipeline…" : "Overview of your field sales pipeline"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className={isFirstLoad ? "border-primary/10 bg-accent/20" : undefined}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon
                  className={`h-4 w-4 text-muted-foreground ${isFirstLoad ? "animate-pulse text-primary/60" : ""}`}
                />
              </CardHeader>
              <CardContent>
                <CuteStat loading={isFirstLoad} value={stat.value} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pipeline by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.values(LocationStatus).map((status) => (
              <div
                key={status}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
                <CuteCount
                  loading={isFirstLoad}
                  value={data?.statusCounts?.[status]}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isFirstLoad ? (
            <RecentActivityPlaceholder />
          ) : !data?.recentLocations?.length ? (
            <p className="text-muted-foreground">No recent locations yet — go add one!</p>
          ) : (
            <div className="space-y-3">
              {data.recentLocations.map((loc: {
                id: string;
                eventName: string;
                status: LocationStatus;
                country: { name: string };
                state: { name: string };
                assignedRep?: { name: string | null } | null;
              }) => (
                <div
                  key={loc.id}
                  className="flex items-center justify-between rounded-md border p-3 animate-fade-in-up"
                >
                  <div>
                    <p className="font-medium">{loc.eventName}</p>
                    <p className="text-sm text-muted-foreground">
                      {loc.country.name} / {loc.state.name}
                      {loc.assignedRep?.name && ` · ${loc.assignedRep.name}`}
                    </p>
                  </div>
                  <Badge className={STATUS_COLORS[loc.status]}>
                    {STATUS_LABELS[loc.status]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
