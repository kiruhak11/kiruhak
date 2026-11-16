import { createHash, createPublicKey, verify } from "node:crypto";
import { telegramFetch, validateTelegramEndpoint } from "./telegram-http";

const ISSUER = "https://oauth.telegram.org";
const DISCOVERY_URL = `${ISSUER}/.well-known/openid-configuration`;

interface TelegramRecoveryIdTokenOptions {
  clientId: string;
  nonceHash: string;
  expectedTelegramId: string;
  now?: number;
}

interface TelegramRecoveryIdTokenHeader {
  alg?: unknown;
  kid?: unknown;
}

interface TelegramRecoveryIdTokenClaims {
  iss?: unknown;
  aud?: unknown;
  azp?: unknown;
  id?: unknown;
  iat?: unknown;
  exp?: unknown;
  nonce?: unknown;
}

interface TelegramRecoveryDiscoveryDocument {
  issuer?: unknown;
  jwks_uri?: unknown;
}

interface TelegramRecoveryJsonWebKey {
  kid?: string;
  kty: string;
  alg?: string;
  n?: string;
  e?: string;
}

interface TelegramRecoveryJwksDocument {
  keys?: TelegramRecoveryJsonWebKey[];
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function verifyTelegramRecoveryIdToken(
  token: string,
  options: TelegramRecoveryIdTokenOptions,
  fetcher: typeof telegramFetch = telegramFetch
): Promise<boolean> {
  if (!token || token.length > 16384) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  try {
    const header = JSON.parse(
      Buffer.from(parts[0], "base64url").toString("utf8")
    ) as TelegramRecoveryIdTokenHeader;
    const claims = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8")
    ) as TelegramRecoveryIdTokenClaims;

    if (header.alg !== "RS256" || typeof header.kid !== "string") return false;

    const discoveryResponse = await fetcher(DISCOVERY_URL, {
      signal: AbortSignal.timeout(5000),
    });
    if (!discoveryResponse.ok) return false;

    const discovery = (await discoveryResponse.json()) as TelegramRecoveryDiscoveryDocument;
    const jwksUri = discovery.jwks_uri;
    if (discovery.issuer !== ISSUER || typeof jwksUri !== "string") {
      return false;
    }
    const jwksUrl = validateTelegramEndpoint(jwksUri);

    const jwksResponse = await fetcher(jwksUrl.href, {
      signal: AbortSignal.timeout(5000),
    });
    if (!jwksResponse.ok) return false;

    const jwks = (await jwksResponse.json()) as TelegramRecoveryJwksDocument;
    const jwk = jwks.keys?.find(
      (key) =>
        key.kid === header.kid &&
        key.kty === "RSA" &&
        (!key.alg || key.alg === "RS256")
    );
    if (!jwk) return false;

    const key = createPublicKey({ key: jwk, format: "jwk" });
    const signatureValid = verify(
      "RSA-SHA256",
      Buffer.from(`${parts[0]}.${parts[1]}`),
      key,
      Buffer.from(parts[2], "base64url")
    );
    if (!signatureValid) return false;

    const now = options.now ?? Math.floor(Date.now() / 1000);
    const audienceMatches =
      claims.aud === options.clientId ||
      (Array.isArray(claims.aud) &&
        claims.aud.includes(options.clientId) &&
        (claims.aud.length === 1 || claims.azp === options.clientId));
    const signedTelegramId =
      typeof claims.id === "number" &&
      Number.isSafeInteger(claims.id) &&
      claims.id > 0
        ? String(claims.id)
        : typeof claims.id === "string" && /^[1-9]\d*$/.test(claims.id)
          ? claims.id
          : "";

    return (
      claims.iss === ISSUER &&
      audienceMatches &&
      signedTelegramId === options.expectedTelegramId &&
      typeof claims.iat === "number" &&
      Number.isInteger(claims.iat) &&
      claims.iat <= now + 30 &&
      now - claims.iat <= 180 &&
      typeof claims.exp === "number" &&
      claims.exp > now &&
      typeof claims.nonce === "string" &&
      sha256Hex(claims.nonce) === options.nonceHash
    );
  } catch {
    return false;
  }
}
