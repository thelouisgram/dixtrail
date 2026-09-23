import { withAuth } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { viewerFromSession } from "@/lib/auth-helpers";
import { searchVenuesByName } from "@/services/venues.service";

export const GET = withAuth(async (request, session) => {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const venues = await searchVenuesByName(q, viewerFromSession(session));
  return jsonOk(venues);
});
