import { Role } from "@prisma/client";
import { withAuth } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { searchLocationsByName } from "@/services/locations.service";

export const GET = withAuth(async (request, session) => {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const results = await searchLocationsByName(
    query,
    session.user.id,
    session.user.role as Role
  );
  return jsonOk(results);
});
