"use client";

import { format } from "date-fns";
import { useUIStore } from "@/stores/ui-store";
import { useUserDetail } from "@/hooks/use-users";
import { ACTIVITY_LABELS, ROLE_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BouncingDots } from "@/components/ui/cute-placeholder";

export function UserDetailDialog() {
  const { userDetailId, setUserDetailId } = useUIStore();
  const { data: user, isPending } = useUserDetail(userDetailId);

  function handleOpenChange(open: boolean) {
    if (!open) setUserDetailId(null);
  }

  return (
    <Dialog open={!!userDetailId} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        {isPending || !user ? (
          <div className="flex justify-center py-12">
            <BouncingDots />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{user.name ?? "Unnamed user"}</DialogTitle>
              <DialogDescription>{user.email}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                <span className="text-sm text-muted-foreground">
                  Joined {format(new Date(user.createdAt), "MMM d, yyyy")}
                </span>
              </div>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Assigned cities</h3>
                {user.assignedCities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No cities assigned.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {user.assignedCities.map(({ city }) => (
                      <Badge key={city.id} variant="outline">
                        {city.name}, {city.state.name} ({city.state.country.name})
                      </Badge>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold">
                  Assigned locations ({user._count.assignedLocations})
                </h3>
                {user.assignedLocations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assigned locations.</p>
                ) : (
                  <ul className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
                    {user.assignedLocations.map((loc) => (
                      <li key={loc.id} className="flex items-start justify-between gap-3 text-sm">
                        <div>
                          <p className="font-medium">{loc.eventName}</p>
                          <p className="text-muted-foreground">
                            {loc.country.name} / {loc.state.name}
                            {loc.city?.name ? ` / ${loc.city.name}` : ""}
                          </p>
                        </div>
                        <Badge className={STATUS_COLORS[loc.status]}>
                          {STATUS_LABELS[loc.status]}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold">
                  Created locations ({user._count.createdLocations})
                </h3>
                {user.createdLocations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No locations created.</p>
                ) : (
                  <ul className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
                    {user.createdLocations.map((loc) => (
                      <li key={loc.id} className="text-sm">
                        <p className="font-medium">{loc.eventName}</p>
                        <p className="text-muted-foreground">
                          {loc.country.name} / {loc.state.name}
                          {loc.city?.name ? ` / ${loc.city.name}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Recent actions</h3>
                {user.activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recorded actions yet.</p>
                ) : (
                  <ul className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                    {user.activities.map((activity) => (
                      <li key={activity.id} className="text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">
                              {ACTIVITY_LABELS[activity.type] ?? activity.type}
                            </p>
                            <p className="text-muted-foreground">{activity.description}</p>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
