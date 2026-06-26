import { Role } from "@prisma/client";
import { withAuth } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { getDashboardStats } from "@/services/dashboard.service";

export const GET = withAuth(async (_request, session) => {
  const stats = await getDashboardStats(
    session.user.id,
    session.user.role as Role
  );
  return jsonOk(stats);
});
