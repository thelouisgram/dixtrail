import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { withRole, type AuthedSession, type RouteContext } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { deleteCountry } from "@/services/countries.service";

export const DELETE = withRole([Role.ADMIN, Role.MANAGER], async (_request: NextRequest, _session: AuthedSession, context: RouteContext) => {
  const { id } = await context.params;
  await deleteCountry(id);
  return jsonOk({ success: true });
});
