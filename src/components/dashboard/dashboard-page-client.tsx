"use client";

import Link from "next/link";
import { useDashboard } from "@/hooks/use-dashboard";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { LocationStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, DollarSign, Globe, Layers, MapPin, Percent, Users } from "lucide-react";
import {
  CuteStat,
  CuteCount,
  EmptyState,
  isInitialQueryLoad,
  LOADING_SURFACE_CLASS,
  RecentActivityPlaceholder,
} from "@/components/ui/cute-placeholder";
import { PageHeader } from "@/components/ui/page-header";
import { QueryPageError } from "@/components/ui/query-page-error";
import { cn } from "@/lib/utils";

interface DashboardPageClientProps {
  userRole: string;
  isSixClub?: boolean;
  isIndependent?: boolean;
}

export function DashboardPageClient({
  userRole,
  isSixClub = false,
  isIndependent = false,
}: DashboardPageClientProps) {
  const { data, isPending, isError, refetch } = useDashboard();
  const isAdmin = userRole === "ADMIN" || userRole === "MANAGER";
  const showLocations = data ? data.view !== "venues" : !isSixClub;
  const showVenues = data ? data.view !== "locations" : isSixClub || isAdmin;
  const ownLocations = Boolean(data?.ownOnly && showLocations) || (isIndependent && !isSixClub);
  const ownVenues = Boolean(data?.ownOnly && showVenues) || (isIndependent && isSixClub);
  const isFirstLoad = isInitialQueryLoad(isPending, data);

  const description = showVenues && !showLocations
    ? ownVenues
      ? "Your 6ixClubs venues, the percentage they take, gross revenue, and their cut"
      : "6ixClubs venues, the percentage they take, gross revenue, and their cut"
    : ownLocations
      ? "Only the locations assigned to you"
      : "Luxe Dispense field sales — locations, outreach, and pipeline at a glance";

  const locationStats = [
    {
      label: ownLocations ? "My Locations" : "Total Locations",
      value: data?.totalLocations,
      icon: MapPin,
      href: "/dashboard/locations",
      show: showLocations,
    },
    {
      label: "Team Members",
      value: data?.totalUsers,
      icon: Users,
      href: "/dashboard/users",
      show: isAdmin && showLocations,
    },
    {
      label: "Countries",
      value: data?.totalCountries,
      icon: Globe,
      href: "/dashboard/territories",
      show: isAdmin && showLocations,
    },
    {
      label: "Provinces/States",
      value: data?.totalStates,
      icon: Layers,
      href: "/dashboard/territories",
      show: isAdmin && showLocations,
    },
  ].filter((s) => s.show);

  const venueStats = [
    {
      label: ownVenues ? "My 6ixClubs venues" : "6ixClubs venues",
      value: data?.totalVenues,
      icon: Building2,
      href: "/dashboard/venues",
      money: false,
    },
    {
      label: "Gross revenue",
      value: data?.totalGrossRevenue,
      icon: DollarSign,
      href: "/dashboard/venues",
      money: true,
    },
    {
      label: "Their cut",
      value: data?.totalTheirCut,
      icon: Percent,
      href: "/dashboard/venues",
      money: true,
    },
  ];

  return (
    <QueryPageError isError={isError} refetch={refetch}>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Dashboard"
          description={description}
          loadingDescription="Loading your overview…"
          isLoading={isFirstLoad}
        />

        {showLocations && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {locationStats.map((stat, index) => {
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
        )}

        {showVenues && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venueStats.map((stat, index) => {
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
                      <Icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                    </CardHeader>
                    <CardContent>
                      {stat.money ? (
                        <p className="text-2xl font-semibold tabular-nums">
                          {isFirstLoad ? "—" : formatMoney(stat.value)}
                        </p>
                      ) : (
                        <CuteStat loading={isFirstLoad} value={stat.value} />
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {showLocations && (
          <Card className={cn(isFirstLoad && LOADING_SURFACE_CLASS, "animate-fade-in-up")}>
            <CardHeader>
              <CardTitle className="text-base">
                {ownLocations ? "My Pipeline by Status" : "Pipeline by Status"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.values(LocationStatus).map((status, index) => (
                  <Link
                    key={status}
                    href={`/dashboard/locations?status=${status}`}
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
        )}

        {showLocations && (
          <Card className={cn(isFirstLoad && LOADING_SURFACE_CLASS, "animate-fade-in-up")}>
            <CardHeader>
              <CardTitle className="text-base">
                {ownLocations ? "My Recent Activity" : "Recent Activity"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isFirstLoad ? (
                <RecentActivityPlaceholder />
              ) : !data?.recentLocations?.length ? (
                <EmptyState
                  className="py-8"
                  title={
                    ownLocations
                      ? "No assigned locations yet — check back after you're assigned to one."
                      : "No recent locations yet — go add one!"
                  }
                />
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
        )}

        {showVenues && (
          <Card className={cn(isFirstLoad && LOADING_SURFACE_CLASS, "animate-fade-in-up")}>
            <CardHeader>
              <CardTitle className="text-base">
                {ownVenues ? "My 6ixClubs venues" : "6ixClubs venues"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isFirstLoad ? (
                <RecentActivityPlaceholder />
              ) : !data?.recentVenues?.length ? (
                <EmptyState
                  className="py-8"
                  title={
                    ownVenues
                      ? "No 6ixClubs venues assigned to you yet."
                      : "No 6ixClubs venues yet."
                  }
                />
              ) : (
                <div className="space-y-3">
                  {data.recentVenues.map((venue) => (
                    <div
                      key={venue.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                    >
                      <div>
                        <p className="font-medium">{venue.name}</p>
                        <p className="text-sm text-muted-foreground">{venue.cityName ?? "No city"}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p>{formatMoney(venue.grossRevenue)} gross</p>
                        <p className="text-muted-foreground">
                          {venue.cutPercentage}% · {formatMoney(venue.theirCut)} cut
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </QueryPageError>
  );
}
