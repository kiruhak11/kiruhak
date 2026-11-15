import { prisma } from "../utils/prisma";
import {
  getAuthSessionKeyHash,
  verifyAuthToken,
  wasTokenIssuedBeforeRevocation,
} from "../utils/auth-token";
import {
  getUserSessionsRevokedAt,
  isAuthSessionRevoked,
} from "../utils/session-control";
import { getRuntimeAuthTokenSecret } from "../utils/security-config";
import { isValidBotSecret } from "../utils/bot-secret";
import { classifyApiRoute } from "../utils/auth-route-policy";

function isStaticAsset(path: string): boolean {
  return (
    path.startsWith("/_nuxt/") ||
    path.startsWith("/assets/") ||
    path.startsWith("/images/") ||
    path === "/favicon.ico" ||
    /\.(js|css|png|jpe?g|svg|ico|woff2?)$/i.test(path)
  );
}

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;
  const method = getMethod(event);

  if (isStaticAsset(path)) return;
  if (!path.startsWith("/api/")) return;

  // CORS preflight обрабатывается в server/middleware/cors.ts и не требует
  // авторизации — иначе браузер не смог бы выполнить запрос.
  if (method === "OPTIONS") return;

  // FAIL-CLOSED: маршрут должен быть явно описан в политике.
  const decision = classifyApiRoute(path, method);

  if (decision.kind === "unknown") {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
    });
  }

  if (decision.kind === "method-not-allowed") {
    throw createError({
      statusCode: 405,
      statusMessage: "Method Not Allowed",
    });
  }

  if (decision.policy === "public") return;

  if (decision.policy === "bot") {
    // Служебный API бота: требуется подтверждённый секрет, а не сессия.
    const config = useRuntimeConfig();
    if (!isValidBotSecret(getHeader(event, "x-bot-secret"), config.botSecret)) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
      });
    }
    return;
  }

  const isLogoutRequest = path === "/api/auth/logout" && method === "POST";

  const authHeader =
    getHeader(event, "authorization") || getHeader(event, "Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const token = authHeader.slice(7).trim();
  const config = useRuntimeConfig();
  const decoded = verifyAuthToken(
    token,
    getRuntimeAuthTokenSecret(config.authTokenSecret)
  );

  if (!decoded || decoded.exp < Math.floor(Date.now() / 1000)) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid token",
    });
  }

  const sessionKeyHash = getAuthSessionKeyHash(token, decoded);

  let sessionAlreadyRevoked: boolean;
  try {
    sessionAlreadyRevoked = await isAuthSessionRevoked(sessionKeyHash);
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: "Authentication temporarily unavailable",
    });
  }

  if (sessionAlreadyRevoked && !isLogoutRequest) {
    throw createError({
      statusCode: 401,
      statusMessage: "Session expired",
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "User not found",
    });
  }

  event.context.user = user;

  const revokedAt = await getUserSessionsRevokedAt(user.id);
  if (revokedAt) {
    const tokenIssuedAt = typeof decoded.iat === "number" ? decoded.iat : 0;
    if (
      wasTokenIssuedBeforeRevocation(tokenIssuedAt, revokedAt) &&
      !isLogoutRequest
    ) {
      throw createError({
        statusCode: 401,
        statusMessage: "Session expired",
      });
    }
  }

  event.context.authSessionKeyHash = sessionKeyHash;
  event.context.authSessionExpiresAt = new Date(decoded.exp * 1000);
  event.context.authSessionAlreadyRevoked = sessionAlreadyRevoked;

  if (decision.policy === "admin" && !user.isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: "Admin access required",
    });
  }
});
