const PLACEHOLDER_SECRETS = [
  "development-secret-key-change-me-in-prod",
  "change-me",
  "your-secret-here",
];

export function validateEnv() {
  if (process.env.NODE_ENV !== "production") return;

  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is required in production. Generate one with: openssl rand -base64 33"
    );
  }

  const lower = secret.toLowerCase();
  if (PLACEHOLDER_SECRETS.some((placeholder) => lower.includes(placeholder))) {
    throw new Error(
      "AUTH_SECRET must not use a placeholder value in production. Generate one with: openssl rand -base64 33"
    );
  }

  if (secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters in production.");
  }
}
