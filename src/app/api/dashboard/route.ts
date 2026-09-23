import { withAuth } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { viewerFromSession } from "@/lib/auth-helpers";
import { getDashboardStats } from "@/services/dashboard.service";
import { processFollowUpReminders } from "@/services/follow-up-reminders.service";

export const GET = withAuth(async (_request, session) => {
  await processFollowUpReminders();

  const stats = await getDashboardStats(viewerFromSession(session));
  return jsonOk(stats);
});
