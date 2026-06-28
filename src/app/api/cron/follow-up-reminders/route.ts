import { NextRequest } from "next/server";
import { jsonOk } from "@/lib/api-response";
import { processFollowUpReminders } from "@/services/follow-up-reminders.service";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");

  if (secret && authHeader !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  await processFollowUpReminders();
  return jsonOk({ success: true });
}
