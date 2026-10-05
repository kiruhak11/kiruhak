import { createHmac, timingSafeEqual } from "node:crypto";

export interface AuthTokenPayload {
  userId: string;
  telegramId: string;
  isAdmin: boolean;
  exp: number;
  iat?: number;
}

function toBase64Url(value: Buffer | string): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error("Invalid base64url value");
  }
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = 4 - (normalized.length % 4 || 4);
  return normalized + "=".repeat(padding);
}

export function createAuthToken(
  payload: AuthTokenPayload,
  secret: string
): string {
  if (!secret) throw new Error("Auth token secret is not configured");
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(encodedPayload).digest();
  const encodedSignature = toBase64Url(signature);
  return `${encodedPayload}.${encodedSignature}`;
}

function verifySignedToken(
  token: string,
  secret: string
): AuthTokenPayload | null {
  if (!secret || token.length > 8192) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, encodedSignature] = parts;
  if (!encodedPayload || !encodedSignature) return null;

  let expectedSignature: Buffer;
  let actualSignature: Buffer;
  let decodedPayload: string;
  try {
    expectedSignature = createHmac("sha256", secret)
      .update(encodedPayload)
      .digest();
    actualSignature = Buffer.from(fromBase64Url(encodedSignature), "base64");
    decodedPayload = Buffer.from(fromBase64Url(encodedPayload), "base64").toString(
      "utf8"
    );
  } catch {
    return null;
  }

  if (expectedSignature.length !== actualSignature.length) {
    return null;
  }
  if (!timingSafeEqual(expectedSignature, actualSignature)) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      decodedPayload
    );

    if (
      !decoded.userId ||
      !decoded.telegramId ||
      typeof decoded.exp !== "number" ||
      !Number.isFinite(decoded.exp) ||
      typeof decoded.isAdmin !== "boolean" ||
      (decoded.iat !== undefined &&
        (typeof decoded.iat !== "number" || !Number.isFinite(decoded.iat)))
    ) {
      return null;
    }

    return decoded as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function verifyAuthToken(
  token: string,
  secret: string,
  now = Math.floor(Date.now() / 1000)
): AuthTokenPayload | null {
  const payload = verifySignedToken(token, secret);
  return payload && payload.exp > now ? payload : null;
}
