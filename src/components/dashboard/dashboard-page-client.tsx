"use client";

import Link from "next/link";
import { useDashboard } from "@/hooks/use-dashboard";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import { LocationStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Layers, MapPin, Users } from "lucide-react";
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
  const isSalesRep = userRole === "SALES_REP";
  const isFirstLoad = isPending && !data;
  const myLocationsQuery = isSalesRep ? "?mineOnly=true" : "";

  const stats = [
    {
      label: isSalesRep ? "My Locations" : "Total Locations",
      value: data?.totalLocations,
      icon: MapPin,
      href: `/dashboard/locations${myLocationsQuery}`,
      show: true,
    },
    {
      label: "Team Members",
      value: data?.totalUsers,
      icon: Users,
      href: "/dashboard/users",
      show: isAdmin,
    },
    {
      label: "Countries",
      value: data?.totalCountries,
      icon: Globe,
      href: "/dashboard/territories",
      show: isAdmin,
    },
    {
      label: "Provinces/States",
      value: data?.totalStates,
      icon: Layers,
      href: "/dashboard/territories",
      show: isAdmin,
    },
  ].filter((s) => s.show);

  return (
    <QueryPageError isError={isError} refetch={refetch}>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Dashboard"
          description={
            isSalesRep
              ? "Your assigned locations, outreach, and pipeline at a glance"
              : "Luxe Dispense field sales — locations, outreach, and pipeline at a glance"
          }
          loadingDescription="Loading your Luxe Dispense overview…"
          isLoading={isFirstLoad}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} href={stat.href} className="group block">
                <Card
                  className={cn(
                    isFirstLoad && LOADING_SURFACE_CLASS,
                    "animate-fade-in-up transition-colors hover:border-primary/30 hover:bg-accent/30"
                  )}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                      {stat.label}
                    </CardTitle>
                    <Icon
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary",
                        isFirstLoad && "text-primary/60 animate-gentle-pulse"
                      )}
                    />
                  </CardHeader>
                  <CardContent>
                    <CuteStat loading={isFirstLoad} value={stat.value} />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <Card className={cn(isFirstLoad && LOADING_SURFACE_CLASS, "animate-fade-in-up")}>
          <CardHeader>
            <CardTitle className="text-base">
              {isSalesRep ? "My Pipeline by Status" : "Pipeline by Status"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.values(LocationStatus).map((status, index) => (
                <Link
                  key={status}
                  href={`/dashboard/locations?status=${status}${isSalesRep ? "&mineOnly=true" : ""}`}
                  className="group block"
                >
                  <div
                    className={cn(
                      "flex animate-fade-in-up items-center justify-between rounded-md border p-3 transition-colors hover:border-primary/30 hover:bg-accent/20",
                      isFirstLoad && "border-dashed border-primary/15 bg-background/50"
                    )}
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
                    <CuteCount loading={isFirstLoad} value={data?.statusCounts?.[status]} />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isFirstLoad && LOADING_SURFACE_CLASS, "animate-fade-in-up")}>
          <CardHeader>
            <CardTitle className="text-base">
              {isSalesRep ? "My Recent Activity" : "Recent Activity"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isFirstLoad ? (
              <RecentActivityPlaceholder />
            ) : !data?.recentLocations?.length ? (
              <p className="text-muted-foreground animate-fade-in-up">
                {isSalesRep
                  ? "No assigned locations yet — check back after you're assigned to one."
                  : "No recent locations yet — go add one!"}
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentLocations.map((loc, index) => (
                  <div
                    key={loc.id}
                    className="flex animate-fade-in-up items-center justify-between rounded-md border p-3"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div>
                      <p className="font-medium">{loc.eventName}</p>
                      <p className="text-sm text-muted-foreground">
                        {loc.country.name} / {loc.state.name}
                        {loc.city?.name ? ` / ${loc.city.name}` : ""}
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
