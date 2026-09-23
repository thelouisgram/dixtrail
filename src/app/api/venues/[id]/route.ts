import { NextRequest } from "next/server";
import { withAuth, type AuthedSession, type RouteContext } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { viewerFromSession } from "@/lib/auth-helpers";
import { updateVenueSchema } from "@/lib/validations";
import { deleteVenue, updateVenue } from "@/services/venues.service";

export const PATCH = withAuth(
  async (request: NextRequest, session: AuthedSession, context: RouteContext) => {
    const { id } = await context.params;
    const body = await request.json();
    const data = updateVenueSchema.parse(body);
    const venue = await updateVenue(id, data, viewerFromSession(session));
    return jsonOk(venue);
  }
);

export const DELETE = withAuth(
  async (_request: NextRequest, session: AuthedSession, context: RouteContext) => {
    const { id } = await context.params;
    await deleteVenue(id, viewerFromSession(session));
    return jsonOk({ success: true });
  }
);
