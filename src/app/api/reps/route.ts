import { withAuth } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { getSalesReps } from "@/services/users.service";

export const GET = withAuth(async () => {
  const reps = await getSalesReps();
  return jsonOk(reps);
});
