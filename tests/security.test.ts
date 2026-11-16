import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { test } from "node:test";
import { sanitizeHtml } from "../util/sanitize-html";
import {
  createAuthToken,
  verifyAuthToken,
} from "../server/utils/auth-token";
import {
  assertProductionAuthTokenSecret,
  corsHeadersForOrigin,
  parseCorsAllowlist,
  resolveAuthTokenSecret,
} from "../server/utils/security-config";
import {
  hashPassword,
  isHashedPassword,
  verifyPassword,
} from "../server/utils/password";
import {
  API_ROUTE_TABLE,
  classifyApiRoute,
  isAdminApiRoute,
  isAuthenticatedRoute,
  isBotInternalRoute,
  isPublicApiRoute,
  isValidMaterialId,
} from "../server/utils/auth-route-policy";
import {
  isValidBotSecret,
  resolveExpectedBotSecret,
} from "../server/utils/bot-secret";

const payload = {
  userId: "user-1",
  telegramId: "12345",
  isAdmin: false,
  iat: 1_700_000_000,
  exp: 1_800_000_000,
};

test("auth secret allows development fallback but requires a strong production secret", () => {
  assert.equal(resolveAuthTokenSecret({}, "development"), "dev-only-auth-token-secret");
  assert.doesNotThrow(() =>
    assertProductionAuthTokenSecret("dev-only-auth-token-secret", "development")
  );
  assert.throws(() => assertProductionAuthTokenSecret("", "production"), /Invalid production auth configuration/);
  assert.throws(() =>
    assertProductionAuthTokenSecret("dev-only-auth-token-secret", "production")
  );
  assert.doesNotThrow(() =>
    assertProductionAuthTokenSecret("a-unique-random-secret-at-least-32-chars", "production")
  );
  assert.equal(
    resolveAuthTokenSecret({ NODE_ENV: "production" }, "production"),
    ""
  );
});

test("CORS returns one exact allowlisted origin and supports multiple origins", () => {
  const allowed = parseCorsAllowlist("https://portfolio.example, https://app.example");
  const first = corsHeadersForOrigin("https://portfolio.example", allowed);
  const second = corsHeadersForOrigin("https://app.example", allowed);
  assert.equal(first["Access-Control-Allow-Origin"], "https://portfolio.example");
  assert.equal(second["Access-Control-Allow-Origin"], "https://app.example");
  assert.equal(first["Access-Control-Allow-Credentials"], "true");
  assert.deepEqual(corsHeadersForOrigin("https://evil.example", allowed), {});
  assert.deepEqual(corsHeadersForOrigin(undefined, allowed), {});

  const wildcard = corsHeadersForOrigin("https://any.example", new Set(["*"]));
  assert.equal(wildcard["Access-Control-Allow-Origin"], "*");
  assert.equal(wildcard["Access-Control-Allow-Credentials"], undefined);
});

test("password verification accepts secure hashes and upgrades legacy plaintext after a correct login", () => {
  const hash = hashPassword("correct horse battery staple");
  assert.ok(isHashedPassword(hash));
  assert.equal(verifyPassword("correct horse battery staple", hash), true);
  assert.equal(verifyPassword("wrong password", hash), false);

  const legacy = "old-plaintext-password";
  assert.equal(isHashedPassword(legacy), false);
  assert.equal(verifyPassword(legacy, legacy), true);
  assert.equal(verifyPassword("wrong", legacy), false);
  const migrated = hashPassword(legacy);
  assert.equal(isHashedPassword(migrated), true);
  assert.equal(verifyPassword(legacy, migrated), true);
});

test("rich text sanitizer removes executable markup and unsafe URL schemes", () => {
  const sanitized = sanitizeHtml(
    '<p>Safe <strong>text</strong></p><script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">link</a><svg onload="alert(1)"></svg>'
  );

  assert.match(sanitized, /<p>Safe <strong>text<\/strong><\/p>/);
  assert.doesNotMatch(sanitized, /<script|<svg|onerror|onload|javascript:/i);
});

test("auth tokens verify signatures, expiration, and malformed input", () => {
  const secret = "test-only-random-secret-with-more-than-32-characters";
  const token = createAuthToken(payload, secret);
  const decoded = verifyAuthToken(token, secret, 1_750_000_000);

  // Токен содержит исходные поля плюс jti — идентификатор сессии,
  // который используется для точечного отзыва.
  assert.ok(decoded);
  assert.equal(decoded?.userId, payload.userId);
  assert.equal(decoded?.telegramId, payload.telegramId);
  assert.equal(decoded?.isAdmin, payload.isAdmin);
  assert.equal(decoded?.exp, payload.exp);
  assert.equal(decoded?.iat, payload.iat);
  assert.match(decoded?.jti ?? "", /^[A-Za-z0-9_-]{43}$/);

  assert.equal(verifyAuthToken(token, "different-random-secret-long-enough", 1_750_000_000), null);
  assert.equal(verifyAuthToken(token, secret, 1_800_000_000), null);
  assert.equal(verifyAuthToken("not.a.valid.token", secret), null);
  assert.equal(verifyAuthToken("%%% .%%%", secret), null);

  const unsignedLegacy = Buffer.from(JSON.stringify(payload)).toString("base64");
  assert.equal(verifyAuthToken(unsignedLegacy, secret, 1_750_000_000), null);
});

test("material text downloads are authenticated while material reads remain public", () => {
  assert.equal(isPublicApiRoute("/api/materials", "GET"), true);
  assert.equal(isPublicApiRoute("/api/materials/material-123", "GET"), true);

  for (const path of [
    "/api/materials/material-123/download-pdf-simple",
    "/api/materials/material-123/download-pdf",
  ]) {
    assert.equal(isPublicApiRoute(path, "GET"), false);
    assert.equal(isAuthenticatedRoute(path, "GET"), true);
  }

  assert.equal(isAuthenticatedRoute("/api/materials/material-123/download-pdf-simple", "POST"), false);
});

test("material download IDs accept expected identifiers and reject malformed input", () => {
  assert.equal(isValidMaterialId("cmm7zid0n0004o301rk66jffv"), true);
  assert.equal(isValidMaterialId("material_123-abc"), true);
  assert.equal(isValidMaterialId(""), false);
  assert.equal(isValidMaterialId("../secret"), false);
  assert.equal(isValidMaterialId("x".repeat(129)), false);
  assert.equal(isValidMaterialId(undefined), false);
});

test("unknown API routes are denied by default instead of failing open", () => {
  // Ни один неизвестный путь не должен попадать в публичную политику.
  for (const path of [
    "/api/does-not-exist",
    "/api/materials/../../etc/passwd",
    "/api/brief/unknown",
    "/api/auth/unknown",
    "/api/telegram/unknown",
  ]) {
    const decision = classifyApiRoute(path, "GET");
    assert.equal(decision.kind, "unknown", `${path} must not be classified`);
    assert.equal(isPublicApiRoute(path, "GET"), false);
    assert.equal(isAuthenticatedRoute(path, "GET"), false);
  }

  // Новые маршруты внутри известных пространств не становятся публичными:
  // они требуют авторизации, а не открытого доступа.
  for (const path of [
    "/api/admin/secret-new-endpoint",
    "/api/user/unknown-action",
  ]) {
    assert.equal(isPublicApiRoute(path, "GET"), false);
    assert.notEqual(classifyApiRoute(path, "GET").kind, "unknown");
  }
});

test("known API paths with an unsupported method are rejected", () => {
  const decision = classifyApiRoute("/api/projects", "DELETE");
  assert.equal(decision.kind, "method-not-allowed");
  assert.equal(classifyApiRoute("/api/projects", "GET").kind, "allow");
  assert.equal(classifyApiRoute("/api/materials", "PATCH").kind, "method-not-allowed");
});

test("route classification separates public, user, admin and bot surfaces", () => {
  assert.equal(classifyApiRoute("/api/health", "GET").kind, "allow");
  assert.equal(classifyApiRoute("/api/projects", "GET").kind, "allow");
  assert.equal(classifyApiRoute("/api/materials", "GET").kind, "allow");
  assert.equal(classifyApiRoute("/api/materials", "POST").kind, "allow");
  assert.equal(isAdminApiRoute("/api/materials", "POST"), true);
  assert.equal(isAdminApiRoute("/api/materials", "GET"), false);

  assert.equal(isBotInternalRoute("/api/bot/quick-login", "POST"), true);
  assert.equal(isBotInternalRoute("/api/bot/quick-login", "GET"), false);
  assert.equal(isBotInternalRoute("/api/auth/create-account", "POST"), true);
  assert.equal(
    isBotInternalRoute("/api/ui-components/abc/bot-moderate", "POST"),
    true
  );
  assert.equal(isBotInternalRoute("/api/projects", "GET"), false);

  assert.equal(isAuthenticatedRoute("/api/user/me", "GET"), true);
  assert.equal(isAuthenticatedRoute("/api/brief", "POST"), true);
  assert.equal(isAuthenticatedRoute("/api/auth/logout", "POST"), true);
  assert.equal(isAuthenticatedRoute("/api/auth/recovery/challenge", "POST"), true);
});

test("every API route file is covered by the fail-closed policy", () => {
  // Таблица политики непуста, и ни одна комбинация
  // «шаблон пути + HTTP-метод» не описывается дважды.
  assert.ok(API_ROUTE_TABLE.length > 20);
  const combinations = API_ROUTE_TABLE.flatMap((rule) =>
    rule.methods.map((method) => `${rule.pattern.source}|${method}`)
  );
  assert.equal(new Set(combinations).size, combinations.length);

  const apiDir = new URL("../server/api/", import.meta.url);
  const routes: { method: string; path: string }[] = [];

  const walk = (dir: URL, prefix: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const child = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, dir);
      if (entry.isDirectory()) {
        walk(child, `${prefix}/${entry.name}`);
        continue;
      }
      // Имя файла: <name>[.<method>].ts, например health.get.ts или [id].put.ts
      const match = /^(.*)\.([a-z]+)\.(?:ts|js)$/.exec(entry.name);
      if (!match) continue;
      const name = match[1];
      const method = match[2].toUpperCase();
      const segments = prefix.split("/").filter(Boolean);
      if (name !== "index") {
        segments.push(name.startsWith("[") ? "route-param" : name);
      }
      const path = `/api/${segments.join("/")}`;
      routes.push({ method, path });
    }
  };

  walk(apiDir, "");

  assert.ok(routes.length > 20, "expected the API surface to be discovered");

  const uncovered = routes.filter(
    ({ method, path }) => classifyApiRoute(path, method).kind === "unknown"
  );

  assert.deepEqual(
    uncovered,
    [],
    `routes missing from the fail-closed policy: ${uncovered
      .map((route) => `${route.method} ${route.path}`)
      .join(", ")}`
  );
});

test("bot secret validation never depends on the environment", () => {
  const configured = "a-bot-secret-that-is-long-enough";

  assert.equal(isValidBotSecret(configured, configured), true);
  assert.equal(isValidBotSecret("wrong-secret-value-here", configured), false);
  assert.equal(isValidBotSecret("", configured), false);
  assert.equal(isValidBotSecret(undefined, configured), false);

  // Отсутствие настроенного секрета запрещает действие, а не разрешает его.
  assert.equal(isValidBotSecret("anything", ""), false);
  assert.equal(resolveExpectedBotSecret(""), process.env.BOT_SECRET || "");
});
