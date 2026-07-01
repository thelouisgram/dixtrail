import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { withRole } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { createCitySchema } from "@/lib/validations";
import {
  createCity,
  deleteCity,
  getCityById,
  searchCities,
} from "@/services/countries.service";

export const GET = withRole([Role.ADMIN, Role.MANAGER, Role.SALES_REP], async (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const id = params.get("id") ?? undefined;
  const stateId = params.get("stateId") ?? undefined;
  const countryId = params.get("countryId") ?? undefined;
  const q = params.get("q") ?? undefined;
  const limit = Math.min(Number(params.get("limit") ?? 50) || 50, 100);

  if (id) {
    const city = await getCityById(id);
    return jsonOk(city ? [city] : []);
  }

  if (q?.trim()) {
    const cities = await searchCities({ q, stateId, countryId, limit });
    return jsonOk(cities);
  }

  return jsonOk([]);
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
