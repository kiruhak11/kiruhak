import assert from "node:assert/strict";
import { test } from "node:test";
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

test("auth tokens verify signatures, expiration, and malformed input", () => {
  const secret = "test-only-random-secret-with-more-than-32-characters";
  const token = createAuthToken(payload, secret);
  assert.deepEqual(verifyAuthToken(token, secret, 1_750_000_000), payload);
  assert.equal(verifyAuthToken(token, "different-random-secret-long-enough", 1_750_000_000), null);
  assert.equal(verifyAuthToken(token, secret, 1_800_000_000), null);
  assert.equal(verifyAuthToken("not.a.valid.token", secret), null);
  assert.equal(verifyAuthToken("%%% .%%%", secret), null);

  const unsignedLegacy = Buffer.from(JSON.stringify(payload)).toString("base64");
  assert.equal(verifyAuthToken(unsignedLegacy, secret, 1_750_000_000), null);
});
