import { prisma } from "../../../utils/prisma";
import { getRuntimeAuthTokenSecret } from "../../../utils/security-config";
import { getTelegramLoginClientId } from "../../../utils/telegram-config";
import {
  TELEGRAM_LOGIN_RATE_LIMIT_LOCK_SQL,
  createTelegramLoginTransactionMaterial,
  getClientKeyHash,
  getTelegramLoginMode,
  getTelegramLoginOrigin,
  isTelegramLoginEnabled,
  telegramLoginCookieNames,
} from "../../../utils/telegram-login";

type TelegramLoginEvent = Parameters<typeof getHeader>[0];

function resolveClientIp(event: TelegramLoginEvent): string {
  const forwardedFor = getHeader(event, "x-forwarded-for");
  const forwardedSocketAddress = forwardedFor?.split(",").at(-1)?.trim();
  return forwardedSocketAddress || getRequestIP(event) || "unknown";
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  setResponseHeader(event, "Referrer-Policy", "no-referrer");

  const config = useRuntimeConfig();
  const mode = getTelegramLoginMode(config.telegramLoginMode);
  if (!isTelegramLoginEnabled(mode)) {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }

  const origin = getTelegramLoginOrigin(String(config.public.siteUrl || ""));
  if (!origin || getHeader(event, "origin") !== origin) {
    throw createError({
      statusCode: 403,
      statusMessage: "Request origin rejected",
    });
  }

  const clientId = getTelegramLoginClientId();
  if (
    !/^[1-9]\d{0,14}$/.test(clientId) ||
    !Number.isSafeInteger(Number(clientId))
  ) {
    throw createError({
      statusCode: 503,
      statusMessage: "Telegram login is unavailable",
    });
  }

  const authSecret = getRuntimeAuthTokenSecret(config.authTokenSecret);
  if (authSecret.length < 32) {
    throw createError({
      statusCode: 503,
      statusMessage: "Telegram login is unavailable",
    });
  }

  const material = createTelegramLoginTransactionMaterial();
  const clientKeyHash = getClientKeyHash({
    ip: resolveClientIp(event),
    secret: authSecret,
  });
  const now = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRawUnsafe(
        TELEGRAM_LOGIN_RATE_LIMIT_LOCK_SQL,
        clientKeyHash
      );

      await tx.telegramLoginTransaction.deleteMany({
        where: { createdAt: { lt: new Date(now.getTime() - 15 * 60 * 1000) } },
      });

      const recentAttempts = await tx.telegramLoginTransaction.count({
        where: {
          clientKeyHash,
          createdAt: { gt: new Date(now.getTime() - 15 * 60 * 1000) },
        },
      });
      if (recentAttempts >= 5) {
        throw createError({
          statusCode: 429,
          statusMessage: "Too many login attempts",
        });
      }

      await tx.telegramLoginTransaction.create({
        data: {
          stateHash: material.stateHash,
          nonceHash: material.nonceHash,
          browserSecretHash: material.browserSecretHash,
          clientKeyHash,
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
        },
      });
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      error.statusCode === 429
    ) {
      throw error;
    }
    throw createError({
      statusCode: 503,
      statusMessage: "Telegram login is unavailable",
    });
  }

  const cookieNames = telegramLoginCookieNames(material.flowKey);
  setCookie(event, cookieNames.browser, material.browserSecret, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/api/auth/telegram-login",
    maxAge: 5 * 60,
  });

  return {
    success: true,
    transaction: material.transaction,
    nonce: material.nonce,
    clientId: Number(clientId),
  };
});
