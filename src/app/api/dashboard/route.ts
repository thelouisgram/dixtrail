import { Role } from "@prisma/client";
import { withAuth } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { getDashboardStats } from "@/services/dashboard.service";
import { processFollowUpReminders } from "@/services/follow-up-reminders.service";

export const GET = withAuth(async (_request, session) => {
  await processFollowUpReminders();

  const stats = await getDashboardStats(
    session.user.id,
    session.user.role as Role
  );
  return jsonOk(stats);
});
