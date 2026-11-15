import { createHash, createPublicKey, verify } from "node:crypto";
import { telegramFetch, validateTelegramEndpoint } from "./telegram-http";

const ISSUER = "https://oauth.telegram.org";
const DISCOVERY_URL = `${ISSUER}/.well-known/openid-configuration`;

interface VerifiedTelegramLoginIdentity {
  subject: string;
  telegramId: string;
}

interface TelegramLoginIdTokenOptions {
  clientId: string;
  nonceHash: string;
  now?: number;
}

interface TelegramLoginIdTokenClaims {
  iss?: unknown;
  aud?: unknown;
  azp?: unknown;
  sub?: unknown;
  id?: unknown;
  iat?: unknown;
  exp?: unknown;
  nonce?: unknown;
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function verifyTelegramLoginIdToken(
  token: string,
  options: TelegramLoginIdTokenOptions,
  fetcher: typeof telegramFetch = telegramFetch
): Promise<VerifiedTelegramLoginIdentity | null> {
  if (!token || token.length > 16384) return null;

  const parts = token.split(".");
  if (
    parts.length !== 3 ||
    parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))
  ) {
    return null;
  }

  try {
    const header = JSON.parse(
      Buffer.from(parts[0], "base64url").toString("utf8")
    ) as TelegramLoginIdTokenHeader;
    const claims = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8")
    ) as TelegramLoginIdTokenClaims;

    if (
      header.alg !== "RS256" ||
      typeof header.kid !== "string" ||
      !header.kid ||
      header.kid.length > 128
    ) {
      return null;
    }

    const discoveryResponse = await fetcher(DISCOVERY_URL, {
      signal: AbortSignal.timeout(5000),
    });
    if (!discoveryResponse.ok) return null;

    const discovery = (await discoveryResponse.json()) as TelegramLoginDiscoveryDocument;
    const jwksUri = discovery.jwks_uri;
    if (discovery.issuer !== ISSUER || typeof jwksUri !== "string") {
      return null;
    }
    const jwksUrl = validateTelegramEndpoint(jwksUri);

    const jwksResponse = await fetcher(jwksUrl.href, {
      signal: AbortSignal.timeout(5000),
    });
    if (!jwksResponse.ok) return null;

    const jwks = (await jwksResponse.json()) as TelegramLoginJwksDocument;
    const jwk = jwks.keys?.find(
      (key) =>
        key.kid === header.kid &&
        key.kty === "RSA" &&
        (!key.alg || key.alg === "RS256") &&
        (!key.use || key.use === "sig") &&
        (!Array.isArray(key.key_ops) || key.key_ops.includes("verify"))
    );
    if (!jwk) return null;

    const key = createPublicKey({ key: jwk, format: "jwk" });
    const signatureValid = verify(
      "RSA-SHA256",
      Buffer.from(`${parts[0]}.${parts[1]}`),
      key,
      Buffer.from(parts[2], "base64url")
    );
    if (!signatureValid) return null;

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
    const subject =
      typeof claims.sub === "string" &&
      claims.sub.length > 0 &&
      claims.sub.length <= 256
        ? claims.sub
        : "";

    const valid =
      claims.iss === ISSUER &&
      audienceMatches &&
      Boolean(subject) &&
      Boolean(signedTelegramId) &&
      typeof claims.iat === "number" &&
      Number.isInteger(claims.iat) &&
      claims.iat <= now + 30 &&
      now - claims.iat <= 180 &&
      typeof claims.exp === "number" &&
      Number.isInteger(claims.exp) &&
      claims.exp > now &&
      typeof claims.nonce === "string" &&
      sha256Hex(claims.nonce) === options.nonceHash;

    return valid ? { subject, telegramId: signedTelegramId } : null;
  } catch {
    return null;
  }
}

interface TelegramLoginIdTokenHeader {
  alg?: unknown;
  kid?: unknown;
}

interface TelegramLoginDiscoveryDocument {
  issuer?: unknown;
  jwks_uri?: unknown;
}

interface TelegramLoginJsonWebKey {
  kid?: string;
  kty: string;
  alg?: string;
  use?: string;
  key_ops?: string[];
  n?: string;
  e?: string;
}

interface TelegramLoginJwksDocument {
  keys?: TelegramLoginJsonWebKey[];
}

export { verifyTelegramLoginIdToken };
