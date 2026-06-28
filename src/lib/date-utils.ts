import { isSameDay } from "date-fns";

/** Parse YYYY-MM-DD from a date input as local noon to avoid timezone drift. */
export function parseDateInput(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

export function formatDateInput(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().split("T")[0];
}

/** YYYY-MM-DD for today's local date — use as min on date inputs. */
export function todayDateInput(referenceDate = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, "0");
  const day = String(referenceDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isFollowUpDueToday(
  followUpDate: Date | null | undefined,
  referenceDate = new Date()
): boolean {
  if (!followUpDate) return false;
  return isSameDay(followUpDate, referenceDate);
}

export function startOfLocalDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfLocalDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
