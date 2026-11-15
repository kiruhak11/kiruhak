import { prisma } from "../../../utils/prisma";
import { getTelegramLoginCredentials } from "../../../utils/telegram-config";
import { telegramFetch } from "../../../utils/telegram-http";
import {
  sha256Hex,
  verifyTelegramRecoveryIdToken,
} from "../../../utils/telegram-oidc";

// Callback Telegram Login: обмен кода на токен, проверка id_token и возврат
// пользователя на страницу восстановления. Ответ — всегда 302-редирект.

interface RecoveryCallbackRow {
  id: string;
  user_id: string;
  nonce_hash: string;
  pkce_verifier: string;
  telegram_id: string;
}

function recoveryRedirect(
  siteUrl: string,
  challengeId: string,
  result: string
): string {
  const url = new URL("/account/recovery", siteUrl);
  if (challengeId) url.searchParams.set("challenge", challengeId);
  url.searchParams.set("result", result);
  return url.toString();
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const oidc = getTelegramLoginCredentials();
  const siteUrl = String(config.public.siteUrl || "").replace(/\/$/, "");

  setResponseHeader(event, "Cache-Control", "no-store");
  setResponseHeader(event, "Referrer-Policy", "no-referrer");

  const query = getQuery(event);
  const state = typeof query.state === "string" ? query.state : "";
  const code = typeof query.code === "string" ? query.code : "";

  if (!siteUrl) {
    throw createError({
      statusCode: 503,
      statusMessage: "Recovery is unavailable",
    });
  }

  if (
    !oidc.clientId ||
    !oidc.clientSecret ||
    !state ||
    !code ||
    state.length > 256 ||
    code.length > 4096
  ) {
    return sendRedirect(event, recoveryRedirect(siteUrl, "", "failed"), 302);
  }

  const result = await prisma.$transaction(async (tx) => {
    // Челлендж атомарно помечается как «обрабатываемый»: повторный callback
    // с тем же state уже ничего не вернёт.
    const rows = await tx.$queryRawUnsafe<RecoveryCallbackRow[]>(
      `UPDATE telegram_recovery_challenges c
       SET callback_started_at = NOW(), attempts = attempts + 1
       FROM users u
       WHERE c.state_hash = $1 AND c.user_id = u.id
         AND c.expires_at > NOW() AND c.consumed_at IS NULL
         AND c.telegram_verified_at IS NULL AND c.callback_started_at IS NULL
         AND c.attempts < 5
       RETURNING c.id, c.user_id, c.nonce_hash, c.pkce_verifier, u."telegramId" AS telegram_id`,
      sha256Hex(state)
    );

    return rows[0] || null;
  });

  if (!result) {
    return sendRedirect(event, recoveryRedirect(siteUrl, "", "failed"), 302);
  }

  let verified = false;

  try {
    const tokenResponse = await telegramFetch("https://oauth.telegram.org/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${oidc.clientId}:${oidc.clientSecret}`
        ).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${siteUrl}/api/auth/recovery/telegram-callback`,
        client_id: oidc.clientId,
        code_verifier: result.pkce_verifier,
      }),
      signal: AbortSignal.timeout(8e3),
    });

    if (tokenResponse.ok) {
      const tokenPayload = (await tokenResponse.json()) as {
        id_token?: unknown;
      };
      verified =
        typeof tokenPayload.id_token === "string" &&
        (await verifyTelegramRecoveryIdToken(tokenPayload.id_token, {
          clientId: oidc.clientId,
          nonceHash: result.nonce_hash,
          expectedTelegramId: result.telegram_id,
        }));
    }
  } catch {
    verified = false;
  }

  if (verified) {
    await prisma.$executeRawUnsafe(
      `UPDATE telegram_recovery_challenges
       SET telegram_verified_at = NOW(), callback_started_at = NULL
       WHERE id = $1 AND callback_started_at IS NOT NULL
         AND consumed_at IS NULL AND telegram_verified_at IS NULL`,
      result.id
    );
    return sendRedirect(
      event,
      recoveryRedirect(siteUrl, result.id, "verified"),
      302
    );
  }

  // Неудачная попытка: сбрасываем блокировку callback, а после пяти попыток
  // выжигаем челлендж целиком.
  await prisma.$executeRawUnsafe(
    `UPDATE telegram_recovery_challenges
     SET callback_started_at = NULL, consumed_at = CASE WHEN attempts >= 5 THEN NOW() ELSE consumed_at END
     WHERE id = $1 AND telegram_verified_at IS NULL`,
    result.id
  );

  setResponseHeader(event, "Cache-Control", "no-store");

  return sendRedirect(event, recoveryRedirect(siteUrl, "", "failed"), 302);
});
