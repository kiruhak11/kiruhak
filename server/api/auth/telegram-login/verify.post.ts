import { prisma } from "../../../utils/prisma";
import { createAuthToken, getAuthTokenTimes } from "../../../utils/auth-token";
import { getRuntimeAuthTokenSecret } from "../../../utils/security-config";
import { getTelegramLoginClientId } from "../../../utils/telegram-config";
import { verifyTelegramLoginIdToken } from "../../../utils/telegram-login-oidc";
import {
  claimSingleUseOperation,
  constantTimeHexEquals,
  getTelegramLoginMode,
  getTelegramLoginOrigin,
  isTelegramLoginAccountAllowed,
  isTelegramLoginEnabled,
  isTelegramLoginIdentityAllowed,
  resolveTelegramLoginAccount,
  sha256TelegramLoginValue,
  telegramLoginCookieNames,
} from "../../../utils/telegram-login";

interface TelegramLoginVerifyBody {
  transaction?: unknown;
  idToken?: unknown;
}

function invalidLogin(): never {
  throw createError({
    statusCode: 401,
    statusMessage: "Telegram login could not be completed",
  });
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  setResponseHeader(event, "Referrer-Policy", "no-referrer");
  setResponseHeader(event, "X-Content-Type-Options", "nosniff");

  const config = useRuntimeConfig();
  const initialMode = getTelegramLoginMode(config.telegramLoginMode);
  if (!isTelegramLoginEnabled(initialMode)) {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }

  const origin = getTelegramLoginOrigin(String(config.public.siteUrl || ""));
  if (!origin || getHeader(event, "origin") !== origin) {
    throw createError({
      statusCode: 403,
      statusMessage: "Request origin rejected",
    });
  }

  const contentType = getHeader(event, "content-type") || "";
  const contentLength = Number(getHeader(event, "content-length") || 0);
  if (
    !contentType.toLowerCase().startsWith("application/json") ||
    contentLength > 20000
  ) {
    throw createError({ statusCode: 413, statusMessage: "Invalid request" });
  }

  const body = (await readBody(event)) as TelegramLoginVerifyBody | null;
  if (
    !body ||
    Object.keys(body).some((key) => !["transaction", "idToken"].includes(key))
  ) {
    throw createError({ statusCode: 400, statusMessage: "Invalid request" });
  }

  const transaction = typeof body.transaction === "string" ? body.transaction : "";
  const idToken = typeof body.idToken === "string" ? body.idToken : "";
  if (
    !/^[A-Za-z0-9_-]{43}$/.test(transaction) ||
    !idToken ||
    idToken.length > 16384
  ) {
    throw createError({ statusCode: 400, statusMessage: "Invalid request" });
  }

  const stateHash = sha256TelegramLoginValue(transaction);
  const flowKey = stateHash.slice(0, 24);
  const cookieName = telegramLoginCookieNames(flowKey).browser;
  const browserSecret = getCookie(event, cookieName) || "";
  if (!browserSecret) return invalidLogin();

  const now = new Date();
  const pending = await prisma.telegramLoginTransaction.findUnique({
    where: { stateHash },
  });
  if (
    !pending ||
    pending.consumedAt ||
    pending.expiresAt <= now ||
    !constantTimeHexEquals(browserSecret, pending.browserSecretHash)
  ) {
    return invalidLogin();
  }

  const claimed = await claimSingleUseOperation(() =>
    prisma.telegramLoginTransaction.updateMany({
      where: {
        stateHash,
        consumedAt: null,
        expiresAt: { gt: now },
        browserSecretHash: pending.browserSecretHash,
      },
      data: { consumedAt: now },
    })
  );

  setCookie(event, cookieName, "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/api/auth/telegram-login",
    maxAge: 0,
  });

  if (!claimed) return invalidLogin();

  const clientId = getTelegramLoginClientId();
  if (
    !/^[1-9]\d{0,14}$/.test(clientId) ||
    !Number.isSafeInteger(Number(clientId))
  ) {
    return invalidLogin();
  }

  const verifiedClaims = await verifyTelegramLoginIdToken(idToken, {
    clientId,
    nonceHash: pending.nonceHash,
  }).catch(() => null);
  if (!verifiedClaims) return invalidLogin();

  const mode = getTelegramLoginMode(config.telegramLoginMode);
  if (
    !isTelegramLoginEnabled(mode) ||
    !isTelegramLoginIdentityAllowed(mode, verifiedClaims.telegramId)
  ) {
    throw createError({
      statusCode: 403,
      statusMessage: "Telegram login is not available for this account",
    });
  }

  const user = await resolveTelegramLoginAccount(
    mode,
    verifiedClaims.telegramId,
    (telegramId) =>
      prisma.user.findMany({
        where: { telegramId },
        select: {
          id: true,
          telegramId: true,
          username: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
          isAdmin: true,
          balance: true,
          createdAt: true,
        },
        take: 2,
      })
  );
  if (!user || !isTelegramLoginAccountAllowed(mode, user)) {
    return invalidLogin();
  }

  const token = createAuthToken(
    {
      userId: user.id,
      telegramId: user.telegramId,
      isAdmin: user.isAdmin,
      ...getAuthTokenTimes(7 * 24 * 60 * 60),
    },
    getRuntimeAuthTokenSecret(config.authTokenSecret)
  );

  return {
    success: true,
    user: { ...user, sitesCount: 0, transactionsCount: 0 },
    token,
  };
});
