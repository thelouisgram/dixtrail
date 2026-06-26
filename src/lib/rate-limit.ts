type RateLimitEntry = {
  failures: number;
  windowStart: number;
  blockedUntil: number;
};

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const BLOCK_MS = 15 * 60 * 1000;

function getEntry(key: string): RateLimitEntry {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now - existing.windowStart > WINDOW_MS) {
    const entry = { failures: 0, windowStart: now, blockedUntil: 0 };
    store.set(key, entry);
    return entry;
  }

  return existing;
}

export function isLoginRateLimited(key: string): boolean {
  const entry = getEntry(key);
  return Date.now() < entry.blockedUntil;
}

export function recordLoginFailure(key: string) {
  const entry = getEntry(key);
  entry.failures += 1;

  if (entry.failures >= MAX_FAILURES) {
    entry.blockedUntil = Date.now() + BLOCK_MS;
  }
}

export function clearLoginFailures(...keys: string[]) {
  for (const key of keys) {
    store.delete(key);
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
