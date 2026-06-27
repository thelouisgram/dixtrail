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
  LOADING_SURFACE_CLASS,
  RecentActivityPlaceholder,
} from "@/components/ui/cute-placeholder";
import { PageHeader } from "@/components/ui/page-header";
import { QueryPageError } from "@/components/ui/query-page-error";
import { cn } from "@/lib/utils";

interface DashboardPageClientProps {
  userRole: string;
}

export function DashboardPageClient({ userRole }: DashboardPageClientProps) {
  const { data, isPending, isError, refetch } = useDashboard();
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
    <QueryPageError isError={isError} refetch={refetch}>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Dashboard"
          description="Luxe Dispense field sales — locations, outreach, and pipeline at a glance"
          loadingDescription="Loading your Luxe Dispense overview…"
          isLoading={isFirstLoad}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className={cn(isFirstLoad && LOADING_SURFACE_CLASS, "animate-fade-in-up")}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon
                    className={cn(
                      "h-4 w-4 text-muted-foreground",
                      isFirstLoad && "text-primary/60 animate-gentle-pulse"
                    )}
                  />
                </CardHeader>
                <CardContent>
                  <CuteStat loading={isFirstLoad} value={stat.value} />
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className={cn(isFirstLoad && LOADING_SURFACE_CLASS, "animate-fade-in-up")}>
          <CardHeader>
            <CardTitle className="text-base">Pipeline by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.values(LocationStatus).map((status, index) => (
                <div
                  key={status}
                  className={cn(
                    "flex animate-fade-in-up items-center justify-between rounded-md border p-3",
                    isFirstLoad && "border-dashed border-primary/15 bg-background/50"
                  )}
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
                  <CuteCount loading={isFirstLoad} value={data?.statusCounts?.[status]} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isFirstLoad && LOADING_SURFACE_CLASS, "animate-fade-in-up")}>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isFirstLoad ? (
              <RecentActivityPlaceholder />
            ) : !data?.recentLocations?.length ? (
              <p className="text-muted-foreground animate-fade-in-up">
                No recent locations yet — go add one!
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentLocations.map((loc: {
                  id: string;
                  eventName: string;
                  status: LocationStatus;
                  country: { name: string };
                  state: { name: string };
                  assignedRep?: { name: string | null } | null;
                }, index: number) => (
                  <div
                    key={loc.id}
                    className="flex animate-fade-in-up items-center justify-between rounded-md border p-3"
                    style={{ animationDelay: `${index * 50}ms` }}
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
    </QueryPageError>
  );
}
