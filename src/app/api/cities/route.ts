import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { withRole, type AuthedSession, type RouteContext } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { createCitySchema } from "@/lib/validations";
import { createCity, deleteCity, getCities } from "@/services/countries.service";

export const GET = withRole([Role.ADMIN, Role.MANAGER, Role.SALES_REP], async (request: NextRequest) => {
  const stateId = request.nextUrl.searchParams.get("stateId") ?? undefined;
  const cities = await getCities(stateId);
  return jsonOk(cities);
});

export const POST = withRole([Role.ADMIN, Role.MANAGER], async (request: NextRequest) => {
  const body = await request.json();
  const { name, stateId } = createCitySchema.parse(body);
  const city = await createCity(name, stateId);
  return jsonOk(city);
});

export const DELETE = withRole([Role.ADMIN, Role.MANAGER], async (request: NextRequest) => {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) throw new Error("City id is required");
  await deleteCity(id);
  return jsonOk({ success: true });
});
