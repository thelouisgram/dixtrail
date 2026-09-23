import { NextRequest } from "next/server";
import { withAuth, type AuthedSession, type RouteContext } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { viewerFromSession } from "@/lib/auth-helpers";
import { updateLocationSchema } from "@/lib/validations";
import { deleteLocation, updateLocation } from "@/services/locations.service";

export const PATCH = withAuth(async (request: NextRequest, session: AuthedSession, context: RouteContext) => {
  const { id } = await context.params;
  const body = await request.json();
  const data = updateLocationSchema.parse(body);
  const location = await updateLocation(id, data, viewerFromSession(session));
  return jsonOk(location);
});

export const DELETE = withAuth(async (_request: NextRequest, session: AuthedSession, context: RouteContext) => {
  const { id } = await context.params;
  await deleteLocation(id, viewerFromSession(session));
  return jsonOk({ success: true });
});
