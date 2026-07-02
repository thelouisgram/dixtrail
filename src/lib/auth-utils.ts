import type { Session } from "next-auth";

/** Route that signs the user out — use instead of /login when a stale cookie causes redirect loops. */
export const CLEAR_SESSION_PATH = "/clear-session";

type CompleteSession = Session & { user: { id: string; role: string; name?: string | null; email?: string | null } };

export function hasCompleteSession(
  session: Session | null | undefined
): session is CompleteSession {
  return !!(session?.user?.id && session.user.role);
}
