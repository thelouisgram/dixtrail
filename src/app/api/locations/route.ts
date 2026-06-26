import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { withAuth } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { locationQuerySchema, createLocationSchema } from "@/lib/validations";
import { createLocation, getLocations } from "@/services/locations.service";

export const GET = withAuth(async (request, session) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = locationQuerySchema.parse(params);
  const result = await getLocations(
    query,
    session.user.id,
    session.user.role as Role
  );
  return jsonOk(result);
});

export const POST = withAuth(async (request, session) => {
  const body = await request.json();
  const data = createLocationSchema.parse(body);
  const location = await createLocation(
    data,
    session.user.id,
    session.user.role as Role
  );
  return jsonOk(location, 201);
});
