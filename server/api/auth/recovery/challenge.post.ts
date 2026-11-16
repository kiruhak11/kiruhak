import { prisma } from "../../../utils/prisma";
import { getTelegramLoginCredentials } from "../../../utils/telegram-config";
import { sha256Hex } from "../../../utils/telegram-oidc";
import { randomBytes, createHash } from "node:crypto";

// Создание челленджа восстановления пароля через официальный Telegram Login.
// Челлендж хранится в таблице telegram_recovery_challenges, доступ к которой
// возможен только через raw SQL: модель в Prisma-схеме отсутствует намеренно.

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const siteUrl = String(config.public.siteUrl || "").replace(/\/$/, "");
  const oidc = getTelegramLoginCredentials();

  if (!oidc.clientId || !oidc.clientSecret || !siteUrl) {
    throw createError({
      statusCode: 503,
      statusMessage: "Recovery is unavailable",
    });
  }

  // Запрос должен приходить ровно с собственного сайта (защита от CSRF).
  if (getHeader(event, "origin") !== siteUrl) {
    throw createError({
      statusCode: 403,
      statusMessage: "Request origin rejected",
    });
  }

  const user = event.context.user;

  if (!user?.id || !user.telegramId) {
    throw createError({
      statusCode: 403,
      statusMessage: "Bound Telegram account required",
    });
  }

  const id = randomBytes(32).toString("hex");
  const state = randomBytes(32).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256").update(verifier).digest("base64url");
  const redirectUri = `${siteUrl}/api/auth/recovery/telegram-callback`;
  const authorizeUrl = new URL("https://oauth.telegram.org/auth");
  authorizeUrl.search = new URLSearchParams({
    client_id: oidc.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    // Telegram documents `id` in the `profile` scope; `sub` is a distinct
    // OIDC subject and must not be confused with existing telegramId values.
    scope: "openid profile",
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  }).toString();

  await prisma.$transaction(async (tx) => {
    // Сериализуем параллельные вызовы восстановления одного пользователя.
    await tx.$queryRawUnsafe(
      `WITH lock_result AS MATERIALIZED (
         SELECT pg_advisory_xact_lock(hashtext($1))
       ) SELECT 1 FROM lock_result`,
      user.id
    );

    // Чистим устаревшие челленджи старше суток.
    await tx.$executeRawUnsafe(
      `DELETE FROM telegram_recovery_challenges
       WHERE user_id = $1 AND created_at < NOW() - INTERVAL '1 day'`,
      user.id
    );

    // Не больше пяти попыток за последние 15 минут.
    const recent = await tx.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*)::bigint AS count FROM telegram_recovery_challenges
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '15 minutes'`,
      user.id
    );

    if (Number(recent[0]?.count || 0) >= 5) {
      throw createError({
        statusCode: 429,
        statusMessage: "Too many recovery attempts",
      });
    }

    // Хеши state и nonce не храним в открытом виде — только SHA-256.
    await tx.$executeRawUnsafe(
      `INSERT INTO telegram_recovery_challenges
        (id, user_id, state_hash, nonce_hash, pkce_verifier, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '5 minutes')`,
      id,
      user.id,
      sha256Hex(state),
      sha256Hex(nonce),
      verifier
    );
  });

  setResponseHeader(event, "Cache-Control", "no-store");

  return {
    success: true,
    challengeId: id,
    authorizeUrl: authorizeUrl.toString(),
  };
});
