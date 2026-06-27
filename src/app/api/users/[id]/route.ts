import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { withRole, type AuthedSession, type RouteContext } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { updateUserSchema } from "@/lib/validations";
import { deleteUser, getUserDetail, updateUser } from "@/services/users.service";

export const GET = withRole(
  [Role.ADMIN, Role.MANAGER],
  async (_request: NextRequest, _session: AuthedSession, context: RouteContext) => {
    const { id } = await context.params;
    const user = await getUserDetail(id);
    return jsonOk(user);
  }
);

export const PATCH = withRole(
  [Role.ADMIN, Role.MANAGER],
  async (request: NextRequest, session: AuthedSession, context: RouteContext) => {
    const { id } = await context.params;
    const body = await request.json();
    const data = updateUserSchema.parse(body);
    const user = await updateUser(id, data, session.user.role as Role);
    return jsonOk(user);
  }
);

export const DELETE = withRole([Role.ADMIN, Role.MANAGER], async (_request: NextRequest, session: AuthedSession, context: RouteContext) => {
  const { id } = await context.params;
  await deleteUser(id, session.user.id);
  return jsonOk({ success: true });
});
