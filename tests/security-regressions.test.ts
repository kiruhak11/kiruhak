import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  classifyApiRoute,
  isAuthenticatedRoute,
  isPublicApiRoute,
} from "../server/utils/auth-route-policy";
import {
  RATE_LIMIT_POLICIES,
  RateLimiter,
  classifyRateLimitedRoute,
  rateLimitKey,
} from "../server/utils/rate-limit";
import { resolveClientIp } from "../server/utils/client-ip";
import { getClientAddress } from "../server/utils/lead-delivery";
import { MATERIAL_PUBLIC_SELECT } from "../server/utils/material-public";

/**
 * Регрессии: ограничение частоты запросов не должно ломать действующие
 * сценарии (вход, восстановление, отправка заявки) и не должно ослаблять
 * уже реализованные гарантии (Materials Privacy, fail-closed авторизация).
 */

const readSource = (relative: string): string =>
  readFileSync(new URL(`../${relative}`, import.meta.url), "utf8");

test("normal login stays public and is allowed below the limit", () => {
  assert.equal(classifyApiRoute("/api/auth/login", "POST").kind, "allow");
  assert.equal(isPublicApiRoute("/api/auth/login", "POST"), true);

  const limiter = new RateLimiter();
  const policy = RATE_LIMIT_POLICIES["auth.login"];

  for (let index = 0; index < policy.limit; index += 1) {
    assert.equal(
      limiter.consume(rateLimitKey("auth.login", "203.0.113.10"), policy)
        .allowed,
      true,
      "обычный вход не должен блокироваться"
    );
  }
});

test("recovery flow keeps its authorization and stays allowed below the limit", () => {
  assert.equal(
    isAuthenticatedRoute("/api/auth/recovery/challenge", "POST"),
    true
  );
  assert.equal(
    isAuthenticatedRoute("/api/auth/recovery/complete", "POST"),
    true
  );
  assert.equal(
    isPublicApiRoute("/api/auth/recovery/telegram-callback", "GET"),
    true
  );

  const limiter = new RateLimiter();
  const policy = RATE_LIMIT_POLICIES["auth.recovery"];
  for (let index = 0; index < policy.limit; index += 1) {
    assert.equal(
      limiter.consume(rateLimitKey("auth.recovery", "203.0.113.11"), policy)
        .allowed,
      true
    );
  }
});

test("a repeated lead submission with the same idempotency key is not duplicated", () => {
  const endpoint = readSource("server/api/telegram.post.ts");

  // Ключ идемпотентности проверяется до создания записи.
  assert.match(endpoint, /idempotency-key/);
  assert.match(endpoint, /A valid idempotency key is required/);
  assert.match(endpoint, /duplicate: true/);
  assert.ok(
    endpoint.indexOf("idempotency-key") < endpoint.indexOf("INSERT INTO lead_deliveries"),
    "проверка ключа должна идти раньше вставки"
  );

  // Лимит формы допускает несколько повторов отправки.
  const policy = RATE_LIMIT_POLICIES["lead.form"];
  assert.ok(policy.limit >= 5, "повторная отправка заявки не должна упираться в лимит");

  // Защита от частых заявок на уровне хранилища сохранена.
  assert.match(endpoint, /LEAD_RATE_LIMIT/);
  assert.match(endpoint, /statusCode: 429/);
});

test("Materials Privacy is preserved: the public DTO exposes no owner identifiers", () => {
  const selected = MATERIAL_PUBLIC_SELECT as Record<string, unknown>;
  assert.equal(selected.userId, undefined);
  assert.equal(selected.ratings, undefined);
  assert.equal(selected.downloads, undefined);

  const source = readSource("server/utils/material-public.ts");
  assert.doesNotMatch(
    source.slice(0, source.indexOf("export function toMaterialPublicHttpError")),
    /userId:\s*true/
  );

  // Публичный маршрут остаётся публичным и не получает id владельца.
  assert.equal(classifyApiRoute("/api/materials", "GET").kind, "allow");
  assert.equal(isPublicApiRoute("/api/materials", "GET"), true);
});

test("the limiter keeps its state consistent when the handler fails", async () => {
  const limiter = new RateLimiter();
  const policy = { limit: 2, windowMs: 60_000 };
  const key = rateLimitKey("lead.form", "203.0.113.12");

  assert.equal(limiter.consume(key, policy).allowed, true);
  assert.equal(limiter.consume(key, policy).allowed, true);
  assert.equal(limiter.consume(key, policy).allowed, false);

  // Ошибка приложения не «сбрасывает» потраченный лимит и не открывает новый
  // запрос: счётчик остаётся исчерпанным до конца окна.
  assert.equal(limiter.consume(key, policy).allowed, false);
  assert.equal(limiter.peek(key)?.count, 4);
});

test("fail-closed authorization and bot secret protection are untouched by the limiter", () => {
  const policySource = readSource("server/utils/auth-route-policy.ts");
  assert.match(policySource, /unknown/);
  assert.match(policySource, /method-not-allowed/);

  const authMiddleware = readSource("server/middleware/auth.ts");
  assert.match(authMiddleware, /classifyApiRoute/);
  assert.match(authMiddleware, /statusCode: 404/);
  assert.match(authMiddleware, /statusCode: 405/);
  assert.match(authMiddleware, /isValidBotSecret/);

  // Limiter не решает авторизацию: он только ограничивает частоту.
  const limiterMiddleware = readSource("server/middleware/rate-limit.ts");
  assert.doesNotMatch(limiterMiddleware, /isValidBotSecret/);
  assert.doesNotMatch(limiterMiddleware, /classifyApiRoute/);
  assert.doesNotMatch(limiterMiddleware, /requireAdmin/);
});

test("the middleware and the lead database limit identify the client identically", () => {
  // Событие в форме реального h3: headers — Headers, пир — socket.
  const event = {
    headers: new Headers({
      "x-forwarded-for": "203.0.113.10, 81.177.135.137",
    }),
    node: { req: { socket: { remoteAddress: "172.18.0.1" } } },
  } as unknown as Parameters<typeof resolveClientIp>[0];

  // Оба потребителя читают одну и ту же конфигурацию из окружения.
  const previous = process.env.TRUSTED_PROXY_IPS;
  process.env.TRUSTED_PROXY_IPS = "172.18.0.1/32, 81.177.135.137/32";

  const byMiddleware = resolveClientIp(event).address;
  const byDatabaseLimit = getClientAddress(event);

  process.env.TRUSTED_PROXY_IPS = previous;

  assert.equal(byMiddleware, "203.0.113.10");
  assert.equal(
    byDatabaseLimit,
    byMiddleware,
    "middleware и DB-лимит заявок должны считать одного и того же клиента"
  );
});

test("the limiter does not apply to worker internals or public reads", () => {
  assert.equal(classifyRateLimitedRoute("POST", "/api/lead-delivery/tick"), null);
  assert.equal(classifyRateLimitedRoute("GET", "/api/materials"), null);
  assert.equal(classifyRateLimitedRoute("GET", "/api/projects"), null);
  assert.equal(classifyRateLimitedRoute("GET", "/api/user/me"), null);
});
