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
    if (
      error.name === "PrismaClientInitializationError" ||
      error.name === "PrismaClientKnownRequestError"
    ) {
      const status = process.env.NODE_ENV === "production" ? 503 : 400;
      const message =
        process.env.NODE_ENV === "production"
          ? "Database unavailable"
          : error.message;
      return jsonError(message, status);
    }
    return jsonError(error.message, 400);
  }
  return jsonError("Internal server error", 500);
}
