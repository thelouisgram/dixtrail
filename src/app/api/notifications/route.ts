import { z } from "zod";
import { withAuth } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import {
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications.service";

const markReadSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  markAll: z.boolean().optional(),
});

export const GET = withAuth(async (request, session) => {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(Number(limitParam) || 20, 1), 100) : 20;
  const data = await getNotificationsForUser(session.user.id, limit);
  return jsonOk(data);
});

export const PATCH = withAuth(async (request, session) => {
  const body = await request.json();
  const data = markReadSchema.parse(body);

  if (data.markAll) {
    await markAllNotificationsRead(session.user.id);
    return jsonOk({ success: true });
  }

  if (data.id) {
    await markNotificationRead(data.id, session.user.id);
    return jsonOk({ success: true });
  }

  throw new Error("Provide notification id or markAll: true");
});
