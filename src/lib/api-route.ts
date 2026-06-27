import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import type { Session } from "next-auth";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-response";

export type RouteContext = { params: Promise<Record<string, string>> };

export type AuthedSession = Session & {
  user: { id: string; role: string; name?: string | null; email?: string | null };
};

type AuthedHandler = (
  request: NextRequest,
  session: AuthedSession,
  context: RouteContext
) => Promise<Response>;

type AuthedHandlerNoContext = (
  request: NextRequest,
  session: AuthedSession
) => Promise<Response>;

export function withAuth(handler: AuthedHandlerNoContext): (request: NextRequest) => Promise<Response>;
export function withAuth(handler: AuthedHandler): (request: NextRequest, context: RouteContext) => Promise<Response>;
export function withAuth(handler: AuthedHandler | AuthedHandlerNoContext) {
  return async (request: NextRequest, context?: RouteContext) => {
    try {
      const session = (await requireAuth()) as AuthedSession;
      if (handler.length >= 3 && context) {
        return await (handler as AuthedHandler)(request, session, context);
      }
      return await (handler as AuthedHandlerNoContext)(request, session);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export function withRole(roles: Role[], handler: AuthedHandlerNoContext): (request: NextRequest) => Promise<Response>;
export function withRole(roles: Role[], handler: AuthedHandler): (request: NextRequest, context: RouteContext) => Promise<Response>;
export function withRole(roles: Role[], handler: AuthedHandler | AuthedHandlerNoContext) {
  return async (request: NextRequest, context?: RouteContext) => {
    try {
      const session = (await requireRole(roles)) as AuthedSession;
      if (handler.length >= 3 && context) {
        return await (handler as AuthedHandler)(request, session, context);
      }
      return await (handler as AuthedHandlerNoContext)(request, session);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
