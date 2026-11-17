import {
  resolveClientIp,
  trustedProxiesFromEnv,
} from "../utils/client-ip";
import {
  RATE_LIMIT_POLICIES,
  classifyRateLimitedRoute,
  rateLimitKey,
  rateLimiter,
} from "../utils/rate-limit";

/**
 * Ограничение частоты запросов к чувствительным API-маршрутам.
 *
 * Адрес клиента определяется с учётом доверенных прокси: forwarded-заголовки
 * от недоверенного источника игнорируются, поэтому подмена
 * `X-Forwarded-For` не позволяет обойти лимит.
 *
 * В логи не пишутся адреса клиентов и секреты — только группа и маршрут.
 */
/** Предупреждение о неверной конфигурации доверенных прокси печатается один раз. */
let warnedAboutChain = false;

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;
  if (!path.startsWith("/api/")) return;

  const method = getMethod(event);
  const group = classifyRateLimitedRoute(method, path);
  if (!group) return;

  const resolution = resolveClientIp(event);
  const clientAddress = resolution.address;

  if (resolution.warning && !warnedAboutChain) {
    warnedAboutChain = true;
    console.warn(
      `[rate-limit] ${resolution.warning}; TRUSTED_PROXY_IPS=${trustedProxiesFromEnv().join(",") || "(пусто)"}`
    );
  }

  const decision = rateLimiter.consume(
    rateLimitKey(group, clientAddress),
    RATE_LIMIT_POLICIES[group]
  );

  setResponseHeader(event, "X-RateLimit-Limit", String(decision.limit));
  setResponseHeader(event, "X-RateLimit-Remaining", String(decision.remaining));
  setResponseHeader(
    event,
    "X-RateLimit-Reset",
    String(Math.ceil(decision.resetAt / 1000))
  );

  if (decision.allowed) return;

  setResponseHeader(event, "Retry-After", decision.retryAfterSeconds);
  console.warn(
    `[rate-limit] group=${group} path=${path} limit=${decision.limit} retryAfter=${decision.retryAfterSeconds}`
  );

  throw createError({
    statusCode: 429,
    statusMessage: "Too Many Requests",
    data: {
      retryAfter: decision.retryAfterSeconds,
    },
  });
});
