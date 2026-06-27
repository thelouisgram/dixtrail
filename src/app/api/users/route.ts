import { Role } from "@prisma/client";
import { withRole } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { createUserSchema, userQuerySchema } from "@/lib/validations";
import { createUser, getUsers } from "@/services/users.service";

export const GET = withRole([Role.ADMIN, Role.MANAGER], async (request) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = userQuerySchema.parse(params);
  const data = await getUsers(query);
  return jsonOk(data);
});

export const POST = withRole([Role.ADMIN, Role.MANAGER], async (request, session) => {
  const body = await request.json();
  const data = createUserSchema.parse(body);
  const user = await createUser(data, session.user.role as Role);
  return jsonOk(user, 201);
});
