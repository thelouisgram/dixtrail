import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const message = error.issues.map((i) => i.message).join(", ");
    return jsonError(message, 400);
  }
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return jsonError("Unauthorized", 401);
    if (error.message === "Forbidden") return jsonError("Forbidden", 403);
    if (process.env.NODE_ENV === "production" && error.name === "PrismaClientKnownRequestError") {
      return jsonError("Request failed", 400);
    }
    return jsonError(error.message, 400);
  }
  return jsonError("Internal server error", 500);
}
