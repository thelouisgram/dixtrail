import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { withAuth, type AuthedSession, type RouteContext } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { updateLocationSchema } from "@/lib/validations";
import { deleteLocation, updateLocation } from "@/services/locations.service";

export const PATCH = withAuth(async (request: NextRequest, session: AuthedSession, context: RouteContext) => {
  const { id } = await context.params;
  const body = await request.json();
  const data = updateLocationSchema.parse(body);
  const location = await updateLocation(
    id,
    data,
    session.user.id,
    session.user.role as Role
  );
  return jsonOk(location);
});

export const DELETE = withAuth(async (_request: NextRequest, session: AuthedSession, context: RouteContext) => {
  const { id } = await context.params;
  await deleteLocation(id, session.user.id, session.user.role as Role);
  return jsonOk({ success: true });
});
