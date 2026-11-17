import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_TRUSTED_PROXIES,
  isTrustedAddress,
  normalizeIp,
  parseTrustedProxies,
  resolveClientAddress,
  trustedProxyDiagnostics,
  UNKNOWN_CLIENT_ADDRESS,
} from "../server/utils/client-ip";
import {
  RATE_LIMIT_POLICIES,
  RateLimiter,
  classifyRateLimitedRoute,
  rateLimitKey,
  rateLimiter,
} from "../server/utils/rate-limit";

/**
 * Регрессии ограничения частоты запросов и определения адреса клиента.
 */

type HeaderBag = Map<string, string>;

type FakeEvent = {
  node: {
    res: {
      __bag: HeaderBag;
      getHeader: (name: string) => string | undefined;
    };
    req: { socket: { remoteAddress?: string } };
  };
  headers: Headers;
  method: string;
  path: string;
};

const createEvent = (options: {
  method?: string;
  path?: string;
  remoteAddress?: string;
  headers?: Record<string, string>;
}): { event: FakeEvent; bag: HeaderBag } => {
  const bag: HeaderBag = new Map();
  const event: FakeEvent = {
    node: {
      res: {
        __bag: bag,
        getHeader: (name: string) => bag.get(name),
      },
      req: { socket: { remoteAddress: options.remoteAddress ?? "203.0.113.10" } },
    },
    // Реальное событие h3: заголовки — экземпляр Headers.
    headers: new Headers(options.headers ?? {}),
    method: options.method ?? "POST",
    path: options.path ?? "/api/auth/login",
  };
  return { event, bag };
};

let middlewarePromise: Promise<{
  run: (event: FakeEvent) => Promise<void>;
}> | null = null;

/** ESM кэширует импорт, поэтому загрузчик мемоизирован. */
const loadMiddleware = () => {
  if (!middlewarePromise) middlewarePromise = loadMiddlewareOnce();
  return middlewarePromise;
};

const loadMiddlewareOnce = async () => {
  let handler: ((event: FakeEvent) => Promise<void>) | null = null;
  const globals = globalThis as unknown as Record<string, unknown>;

  globals.defineEventHandler = (fn: (event: FakeEvent) => Promise<void>) => {
    handler = fn;
  };
  globals.getRequestURL = (event: FakeEvent) => ({ pathname: event.path });
  globals.getMethod = (event: FakeEvent) => event.method;
  globals.setResponseHeader = (
    event: FakeEvent,
    name: string,
    value: string
  ): void => {
    // Имена HTTP-заголовков регистронезависимы.
    event.node.res.__bag.set(name.toLowerCase(), value);
  };
  globals.createError = (input: {
    statusCode: number;
    statusMessage?: string;
    data?: unknown;
  }) => {
    const error = new Error(input.statusMessage ?? "error") as Error & {
      statusCode: number;
      data?: unknown;
    };
    error.statusCode = input.statusCode;
    error.data = input.data;
    return error;
  };

  await import("../server/middleware/rate-limit");

  return { run: (event: FakeEvent) => handler!(event) };
};

test("only sensitive write routes are rate limited", () => {
  assert.equal(
    classifyRateLimitedRoute("POST", "/api/auth/login"),
    "auth.login"
  );
  assert.equal(
    classifyRateLimitedRoute("POST", "/api/auth/telegram-login/start"),
    "auth.telegram"
  );
  assert.equal(
    classifyRateLimitedRoute("POST", "/api/auth/telegram-login/verify"),
    "auth.telegram"
  );
  assert.equal(
    classifyRateLimitedRoute("POST", "/api/auth/recovery/challenge"),
    "auth.recovery"
  );
  assert.equal(
    classifyRateLimitedRoute("POST", "/api/auth/recovery/complete"),
    "auth.recovery"
  );
  assert.equal(classifyRateLimitedRoute("POST", "/api/telegram"), "lead.form");
  assert.equal(
    classifyRateLimitedRoute("POST", "/api/analytics/track"),
    "analytics.track"
  );
  assert.equal(
    classifyRateLimitedRoute("POST", "/api/analytics/track-simple"),
    "analytics.track"
  );
  assert.equal(
    classifyRateLimitedRoute("POST", "/api/ui-components/abc/view"),
    "ui.view"
  );
  assert.equal(classifyRateLimitedRoute("POST", "/api/bot/quick-login"), "bot");
  assert.equal(
    classifyRateLimitedRoute("POST", "/api/auth/create-account"),
    "bot"
  );
});

test("health, preflight, static and public reads are never limited", () => {
  assert.equal(classifyRateLimitedRoute("OPTIONS", "/api/auth/login"), null);
  assert.equal(classifyRateLimitedRoute("OPTIONS", "/api/brief"), null);
  assert.equal(classifyRateLimitedRoute("GET", "/api/health"), null);
  assert.equal(classifyRateLimitedRoute("POST", "/api/health"), null);
  assert.equal(classifyRateLimitedRoute("GET", "/api/projects"), null);
  assert.equal(classifyRateLimitedRoute("GET", "/api/materials"), null);
  assert.equal(classifyRateLimitedRoute("GET", "/api/tutorials"), null);
  assert.equal(classifyRateLimitedRoute("GET", "/api/sites"), null);
  assert.equal(classifyRateLimitedRoute("GET", "/api/user/me"), null);
  assert.equal(classifyRateLimitedRoute("POST", "/api/unknown-route"), null);
});

test("requests above the limit are rejected with 429 and a correct Retry-After", async () => {
  const { run } = await loadMiddleware();
  rateLimiter.reset();

  const policy = RATE_LIMIT_POLICIES["auth.login"];
  const { event, bag } = createEvent({
    path: "/api/auth/login",
    remoteAddress: "198.51.100.7",
  });

  for (let index = 0; index < policy.limit; index += 1) {
    await run(event);
  }

  assert.equal(bag.get("x-ratelimit-limit"), String(policy.limit));
  assert.equal(bag.get("x-ratelimit-remaining"), "0");

  let rejected = false;
  try {
    await run(event);
  } catch (error) {
    rejected = true;
    const typed = error as { statusCode?: number; data?: { retryAfter?: number } };
    assert.equal(typed.statusCode, 429);
    assert.equal(typed.data?.retryAfter, policy.windowMs / 1000);
  }

  assert.ok(rejected, "превышение лимита должно давать 429");

  const retryAfter = Number(bag.get("retry-after"));
  assert.ok(retryAfter > 0 && retryAfter <= policy.windowMs / 1000);
  assert.ok(Number(bag.get("x-ratelimit-reset")) > 0);
});

test("the limit window expires and the client is served again", () => {
  let now = 1_700_000_000_000;
  const limiter = new RateLimiter({ now: () => now });
  const policy = { limit: 3, windowMs: 60_000 };

  for (let index = 0; index < 3; index += 1) {
    assert.equal(limiter.consume("key", policy).allowed, true);
  }
  assert.equal(limiter.consume("key", policy).allowed, false);

  now += 60_001;
  assert.equal(limiter.consume("key", policy).allowed, true);
  assert.equal(limiter.size, 1);
});

test("parallel requests cannot exceed the limit", async () => {
  const limiter = new RateLimiter();
  const policy = { limit: 5, windowMs: 60_000 };

  const decisions = await Promise.all(
    Array.from({ length: 25 }, async () => limiter.consume("same", policy))
  );

  const allowed = decisions.filter((decision) => decision.allowed).length;
  assert.equal(allowed, 5);
  assert.equal(limiter.peek("same")?.count, 25);
});

test("the limiter store stays bounded and drops expired entries", () => {
  const limiter = new RateLimiter({ maxEntries: 10 });
  const policy = { limit: 100, windowMs: 60_000 };

  for (let index = 0; index < 50; index += 1) {
    limiter.consume(`key-${index}`, policy);
  }

  assert.ok(limiter.size <= 10, "хранилище ограничено по размеру");
});

test("a spoofed X-Forwarded-For cannot change the client identity", () => {
  const trusted = parseTrustedProxies([
    ...DEFAULT_TRUSTED_PROXIES,
    "81.177.135.137/32",
  ]);

  // Соединение не от доверенного прокси: forwarded-заголовки игнорируются.
  const untrusted = resolveClientAddress({
    peer: "198.51.100.23",
    forwardedFor: "1.2.3.4, 5.6.7.8",
    trusted,
  });
  assert.equal(untrusted.address, "198.51.100.23");
  assert.equal(untrusted.source, "peer");

  // Доверенный прокси: берётся самый правый недоверенный адрес, всё, что
  // левее, мог подставить сам клиент.
  const withProxy = resolveClientAddress({
    peer: "127.0.0.1",
    forwardedFor: "1.2.3.4, 203.0.113.55, 81.177.135.137",
    trusted,
  });
  assert.equal(withProxy.address, "203.0.113.55");
  assert.equal(withProxy.source, "forwarded-chain");
});

test("an unverified proxy chain is not trusted and falls back to the peer address", () => {
  const trusted = parseTrustedProxies([
    ...DEFAULT_TRUSTED_PROXIES,
    "81.177.135.137/32",
  ]);

  // Последний хоп цепочки не доверенный — цепочку использовать нельзя.
  const unverified = resolveClientAddress({
    peer: "127.0.0.1",
    forwardedFor: "203.0.113.99",
    trusted,
  });
  assert.equal(unverified.address, "127.0.0.1");
  assert.equal(unverified.source, "untrusted-chain");
  assert.ok(unverified.warning);

  // Полностью доверенная цепочка — адрес клиента определить нельзя.
  const allTrusted = resolveClientAddress({
    peer: "127.0.0.1",
    forwardedFor: "81.177.135.137",
    trusted,
  });
  assert.equal(allTrusted.address, "127.0.0.1");
  assert.equal(allTrusted.source, "untrusted-chain");
});

test("an unavailable peer address yields the documented unknown identity", () => {
  const resolution = resolveClientAddress({
    peer: null,
    forwardedFor: "203.0.113.5, 81.177.135.137",
    trusted: parseTrustedProxies(DEFAULT_TRUSTED_PROXIES),
  });
  assert.equal(resolution.address, UNKNOWN_CLIENT_ADDRESS);
  assert.equal(resolution.source, "unknown");
});

test("trusted proxy diagnostics detect a missing or overly broad configuration", () => {
  const missing = trustedProxyDiagnostics({});
  assert.equal(missing.configured, false);
  assert.equal(missing.warnings.length, 1);
  assert.match(missing.warnings[0], /TRUSTED_PROXY_IPS/);

  const broad = trustedProxyDiagnostics({
    TRUSTED_PROXY_IPS: "10.0.0.0/8, 81.177.135.137/32",
  });
  assert.equal(broad.configured, true);
  assert.ok(
    broad.warnings.some((warning) => warning.includes("10.0.0.0/8")),
    "слишком широкая подсеть должна быть обнаружена"
  );

  const precise = trustedProxyDiagnostics({
    TRUSTED_PROXY_IPS: "81.177.135.137/32, 172.18.0.1/32",
  });
  assert.deepEqual(precise.warnings, []);
});

test("client address normalization and trusted ranges behave predictably", () => {
  assert.equal(normalizeIp("::ffff:203.0.113.7"), "203.0.113.7");
  assert.equal(normalizeIp("[::1]:443"), "::1");
  assert.equal(normalizeIp("203.0.113.7:8080"), "203.0.113.7");
  assert.equal(normalizeIp("не адрес"), null);

  const trusted = parseTrustedProxies([
    ...DEFAULT_TRUSTED_PROXIES,
    "81.177.135.137/32",
  ] as string[]);
  assert.equal(isTrustedAddress("127.0.0.1", trusted), true);
  assert.equal(isTrustedAddress("81.177.135.137", trusted), true);
  assert.equal(isTrustedAddress("203.0.113.5", trusted), false);

  // Приватные сети по умолчанию не доверены: соседний контейнер не должен
  // уметь подменить адрес клиента.
  const defaults = parseTrustedProxies(DEFAULT_TRUSTED_PROXIES);
  assert.equal(isTrustedAddress("10.1.2.3", defaults), false);
  assert.equal(isTrustedAddress("172.17.0.1", defaults), false);
  assert.equal(isTrustedAddress("127.0.0.1", defaults), true);

  assert.equal(
    resolveClientAddress({
      peer: undefined,
      forwardedFor: undefined,
      trusted: parseTrustedProxies(DEFAULT_TRUSTED_PROXIES),
    }).address,
    UNKNOWN_CLIENT_ADDRESS
  );
});

test("the limiter key separates groups and clients", () => {
  assert.notEqual(
    rateLimitKey("auth.login", "203.0.113.1"),
    rateLimitKey("auth.recovery", "203.0.113.1")
  );
  assert.notEqual(
    rateLimitKey("auth.login", "203.0.113.1"),
    rateLimitKey("auth.login", "203.0.113.2")
  );
});
