import { withAuth } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { searchVenuesByName } from "@/services/venues.service";

export const GET = withAuth(async (request) => {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const venues = await searchVenuesByName(q);
  return jsonOk(venues);
});
