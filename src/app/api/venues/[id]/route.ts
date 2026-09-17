import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { withAuth, type AuthedSession, type RouteContext } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { updateVenueSchema } from "@/lib/validations";
import { deleteVenue, updateVenue } from "@/services/venues.service";

export const PATCH = withAuth(
  async (request: NextRequest, session: AuthedSession, context: RouteContext) => {
    const { id } = await context.params;
    const body = await request.json();
    const data = updateVenueSchema.parse(body);
    const venue = await updateVenue(id, data, session.user.id, session.user.role as Role);
    return jsonOk(venue);
  }
);

export const DELETE = withAuth(
  async (_request: NextRequest, session: AuthedSession, context: RouteContext) => {
    const { id } = await context.params;
    await deleteVenue(id, session.user.role as Role);
    return jsonOk({ success: true });
  }
);
