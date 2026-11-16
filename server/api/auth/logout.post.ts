import { prisma } from "../../utils/prisma";
import { revokeAuthSession } from "../../utils/session-control";

/**
 * Выход из текущей сессии.
 *
 * Сессия определяется хешем ключа сессии, который вычисляет middleware
 * авторизации. Отзыв выполняется в транзакции: отзыв сессии не должен
 * оставлять приложение в состоянии, когда токен всё ещё считается живым.
 */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  setResponseHeader(event, "X-Content-Type-Options", "nosniff");

  const sessionKeyHash = event.context.authSessionKeyHash;
  const expiresAt = event.context.authSessionExpiresAt;

  if (typeof sessionKeyHash !== "string" || !(expiresAt instanceof Date)) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  try {
    await prisma.$transaction((tx) => revokeAuthSession(sessionKeyHash, expiresAt, tx));
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: "The session could not be revoked. Please retry.",
    });
  }

  return { success: true };
});
