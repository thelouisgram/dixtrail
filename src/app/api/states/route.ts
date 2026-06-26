import { Role } from "@prisma/client";
import { withAuth, withRole } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { createStateSchema } from "@/lib/validations";
import { createState, getStates } from "@/services/countries.service";

export const GET = withAuth(async (request) => {
  const countryId = request.nextUrl.searchParams.get("countryId") ?? undefined;
  const states = await getStates(countryId);
  return jsonOk(states);
});

export const POST = withRole([Role.ADMIN, Role.MANAGER], async (request) => {
  const body = await request.json();
  const { name, countryId } = createStateSchema.parse(body);
  const state = await createState(name, countryId);
  return jsonOk(state, 201);
});
