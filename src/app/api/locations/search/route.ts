import { withAuth } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { viewerFromSession } from "@/lib/auth-helpers";
import { searchLocationsByName } from "@/services/locations.service";

export const GET = withAuth(async (request, session) => {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const results = await searchLocationsByName(query, viewerFromSession(session));
  return jsonOk(results);
});
