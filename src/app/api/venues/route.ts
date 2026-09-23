import { withAuth } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { viewerFromSession } from "@/lib/auth-helpers";
import { venueQuerySchema, createVenueSchema } from "@/lib/validations";
import { createVenue, getVenues } from "@/services/venues.service";

export const GET = withAuth(async (request, session) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = venueQuerySchema.parse(params);
  const result = await getVenues(query, viewerFromSession(session));
  return jsonOk(result);
});

export const POST = withAuth(async (request, session) => {
  const body = await request.json();
  const data = createVenueSchema.parse(body);
  const venue = await createVenue(data, viewerFromSession(session));
  return jsonOk(venue, 201);
});
