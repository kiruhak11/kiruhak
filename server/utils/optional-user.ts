import type { PrismaClient } from "@prisma/client";
import {
  getAuthSessionKeyHash,
  verifyAuthToken,
  wasTokenIssuedBeforeRevocation,
} from "./auth-token";
import { getUserSessionsRevokedAt, isAuthSessionRevoked } from "./session-control";
import { getRuntimeAuthTokenSecret } from "./security-config";

/**
 * Определяет пользователя по токену из заголовка Authorization, если он есть.
 * Любая ошибка (битый/отозванный/просроченный токен) трактуется как
 * "анонимный запрос" — публичный ответ остаётся безопасным.
 */
export async function resolveOptionalUserId(
  prisma: PrismaClient,
  authorizationHeader: string | undefined | null,
  configuredSecret: string | undefined | null
): Promise<string | null> {
  try {
    if (!authorizationHeader?.startsWith("Bearer ")) return null;
    const token = authorizationHeader.slice(7).trim();
    if (!token) return null;

    const secret = getRuntimeAuthTokenSecret(configuredSecret ?? "");
    if (!secret) return null;

    const decoded = verifyAuthToken(token, secret);
    if (!decoded || decoded.exp < Math.floor(Date.now() / 1000)) return null;

    const sessionKeyHash = getAuthSessionKeyHash(token, decoded);
    if (await isAuthSessionRevoked(sessionKeyHash, prisma)) return null;

    const revokedAt = await getUserSessionsRevokedAt(decoded.userId, prisma);
    if (
      revokedAt &&
      wasTokenIssuedBeforeRevocation(
        typeof decoded.iat === "number" ? decoded.iat : 0,
        revokedAt
      )
    ) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true },
    });
    return user?.id ?? null;
  } catch {
    return null;
  }
}
