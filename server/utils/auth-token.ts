import { createHmac, timingSafeEqual } from "node:crypto";

export interface AuthTokenPayload {
  userId: string;
  telegramId: string;
  isAdmin: boolean;
  exp: number;
}

function toBase64Url(value: Buffer | string): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = 4 - (normalized.length % 4 || 4);
  return normalized + "=".repeat(padding);
}

export function createAuthToken(
  payload: AuthTokenPayload,
  secret: string
): string {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(encodedPayload).digest();
  const encodedSignature = toBase64Url(signature);
  return `${encodedPayload}.${encodedSignature}`;
}

function verifySignedToken(
  token: string,
  secret: string
): AuthTokenPayload | null {
  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) return null;

  const expectedSignature = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest();
  const actualSignature = Buffer.from(fromBase64Url(encodedSignature), "base64");

  if (expectedSignature.length !== actualSignature.length) {
    return null;
  }
  if (!timingSafeEqual(expectedSignature, actualSignature)) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(fromBase64Url(encodedPayload), "base64").toString("utf8")
    );

    if (!decoded.userId || !decoded.telegramId || typeof decoded.exp !== "number") {
      return null;
    }

    return decoded as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function decodeLegacyToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
    if (!decoded.userId || !decoded.telegramId || typeof decoded.exp !== "number") {
      return null;
    }
    return decoded as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function verifyAuthToken(
  token: string,
  secret: string
): AuthTokenPayload | null {
  return verifySignedToken(token, secret) || decodeLegacyToken(token);
}
