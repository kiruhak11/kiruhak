export const DEVELOPMENT_AUTH_TOKEN_SECRET = "dev-only-auth-token-secret";

const KNOWN_WEAK_SECRETS = new Set([
  DEVELOPMENT_AUTH_TOKEN_SECRET,
  "your-secret-key-change-me",
  "change-me",
  "secret",
]);

export function resolveAuthTokenSecret(
  env: NodeJS.ProcessEnv,
  nodeEnv = env.NODE_ENV,
  configuredValue = ""
): string {
  const configured =
    env.NUXT_AUTH_TOKEN_SECRET || env.AUTH_TOKEN_SECRET || configuredValue;
  if (configured) return configured;
  return nodeEnv === "production" ? "" : DEVELOPMENT_AUTH_TOKEN_SECRET;
}

export function getRuntimeAuthTokenSecret(configuredValue: string): string {
  return resolveAuthTokenSecret(
    process.env,
    process.env.NODE_ENV,
    configuredValue
  );
}

export function assertProductionAuthTokenSecret(
  secret: string,
  nodeEnv = process.env.NODE_ENV
): void {
  if (nodeEnv !== "production") return;

  if (
    secret.length < 32 ||
    KNOWN_WEAK_SECRETS.has(secret) ||
    secret === DEVELOPMENT_AUTH_TOKEN_SECRET
  ) {
    throw new Error(
      "Invalid production auth configuration: set AUTH_TOKEN_SECRET (or NUXT_AUTH_TOKEN_SECRET) to a unique random value of at least 32 characters."
    );
  }
}

export function parseCorsAllowlist(value: string): Set<string> {
  return new Set(
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  );
}

export function corsHeadersForOrigin(
  origin: string | undefined,
  allowlist: Set<string>,
  credentials = true
): Record<string, string> {
  if (!origin) return {};
  if (allowlist.has("*")) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    };
  }
  if (!allowlist.has(origin)) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    ...(credentials ? { "Access-Control-Allow-Credentials": "true" } : {}),
  };
}
