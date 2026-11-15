import { prisma } from "../../../utils/prisma";
import { hashPassword } from "../../../utils/password";
import { revokeAllUserSessions } from "../../../utils/session-control";

// Завершение восстановления пароля: меняем пароль и отзываем все сессии.

const MAX_PASSWORD_BYTES = 1024;

interface RecoveryCompleteBody {
  challengeId?: unknown;
  newPassword?: unknown;
  confirmPassword?: unknown;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const siteUrl = String(config.public.siteUrl || "").replace(/\/$/, "");

  // Запрос должен приходить ровно с собственного сайта (защита от CSRF).
  if (getHeader(event, "origin") !== siteUrl) {
    throw createError({
      statusCode: 403,
      statusMessage: "Request origin rejected",
    });
  }

  const user = event.context.user;

  if (!user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const body = await readBody<RecoveryCompleteBody>(event);
  const challengeId =
    typeof body?.challengeId === "string" ? body.challengeId : "";
  const password =
    typeof body?.newPassword === "string" ? body.newPassword : "";
  const confirmation =
    typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

  if (
    !/^[a-f0-9]{64}$/.test(challengeId) ||
    !password ||
    password !== confirmation
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid recovery request",
    });
  }

  if (
    Array.from(password).length < 12 ||
    Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Password does not meet requirements",
    });
  }

  const passwordHash = hashPassword(password);

  try {
    await prisma.$transaction(async (tx) => {
      // Челлендж можно потребить только один раз, только после подтверждения
      // Telegram и только пока он не истёк.
      const consumed = await tx.$queryRawUnsafe<{ id: string }[]>(
        `UPDATE telegram_recovery_challenges
         SET consumed_at = NOW()
         WHERE id = $1 AND user_id = $2 AND expires_at > NOW()
           AND telegram_verified_at IS NOT NULL AND consumed_at IS NULL
         RETURNING id`,
        challengeId,
        user.id
      );

      if (!consumed.length) {
        throw createError({
          statusCode: 403,
          statusMessage: "Recovery confirmation expired or already used",
        });
      }

      await tx.user.update({
        where: { id: user.id },
        data: { password: passwordHash },
      });

      // Все прежние сессии перестают быть действительными.
      await revokeAllUserSessions(user.id, tx);
    });
  } catch (error) {
    // Ошибки createError пробрасываем как есть, остальное — как временный сбой.
    if (error && typeof error === "object" && "statusCode" in error) throw error;
    throw createError({
      statusCode: 503,
      statusMessage: "Password recovery temporarily unavailable",
    });
  }

  setResponseHeader(event, "Cache-Control", "no-store");

  return { success: true };
});
