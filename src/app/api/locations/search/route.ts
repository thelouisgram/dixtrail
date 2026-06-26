import { withAuth } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { searchLocationsByName } from "@/services/locations.service";

export const GET = withAuth(async (request) => {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const results = await searchLocationsByName(query);
  return jsonOk(results);
});
