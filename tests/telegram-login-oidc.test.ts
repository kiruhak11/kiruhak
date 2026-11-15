import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { test } from "node:test";
import { verifyTelegramLoginIdToken } from "../server/utils/telegram-login-oidc";

const ISSUER = "https://oauth.telegram.org";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

const jwk = {
  ...(publicKey.export({ format: "jwk" }) as Record<string, string>),
  kid: "test-kid",
  kty: "RSA",
  alg: "RS256",
  use: "sig",
};

function base64url(value: Buffer | string): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function buildToken(claims: Record<string, unknown>): string {
  const header = base64url(JSON.stringify({ alg: "RS256", kid: "test-kid", typ: "JWT" }));
  const payload = base64url(JSON.stringify(claims));
  const signature = sign("RSA-SHA256", Buffer.from(`${header}.${payload}`), privateKey);
  return `${header}.${payload}.${base64url(signature)}`;
}

function fetcher() {
  return (async (input: string) => {
    if (input === `${ISSUER}/.well-known/openid-configuration`) {
      return {
        ok: true,
        json: async () => ({
          issuer: ISSUER,
          jwks_uri: `${ISSUER}/.well-known/jwks.json`,
        }),
      } as unknown as Response;
    }
    return {
      ok: true,
      json: async () => ({ keys: [jwk] }),
    } as unknown as Response;
  }) as unknown as Parameters<
    typeof verifyTelegramLoginIdToken
  >[2];
}

const CLIENT_ID = "test-client-id";
const NONCE = "test-nonce-value";
const NONCE_HASH = sha256Hex(NONCE);
const NOW = 1_800_000_000;

function baseClaims(overrides: Record<string, unknown> = {}) {
  return {
    iss: ISSUER,
    aud: CLIENT_ID,
    azp: CLIENT_ID,
    sub: "telegram-subject",
    id: 502773482,
    iat: NOW - 10,
    exp: NOW + 600,
    nonce: NONCE,
    ...overrides,
  };
}

test("a valid Telegram id token is accepted", async () => {
  const identity = await verifyTelegramLoginIdToken(
    buildToken(baseClaims()),
    { clientId: CLIENT_ID, nonceHash: NONCE_HASH, now: NOW },
    fetcher()
  );

  assert.deepEqual(identity, {
    subject: "telegram-subject",
    telegramId: "502773482",
  });
});

test("tokens with a wrong nonce, audience, issuer or lifetime are rejected", async () => {
  const cases: { name: string; claims: Record<string, unknown> }[] = [
    { name: "wrong nonce", claims: baseClaims({ nonce: "other-nonce" }) },
    { name: "wrong audience", claims: baseClaims({ aud: "someone-else" }) },
    { name: "wrong issuer", claims: baseClaims({ iss: "https://evil.example" }) },
    { name: "expired", claims: baseClaims({ exp: NOW - 1 }) },
    { name: "issued too long ago", claims: baseClaims({ iat: NOW - 1000 }) },
    { name: "missing subject", claims: baseClaims({ sub: "" }) },
    { name: "missing telegram id", claims: baseClaims({ id: 0 }) },
  ];

  for (const { name, claims } of cases) {
    const identity = await verifyTelegramLoginIdToken(
      buildToken(claims),
      { clientId: CLIENT_ID, nonceHash: NONCE_HASH, now: NOW },
      fetcher()
    );
    assert.equal(identity, null, `expected ${name} to be rejected`);
  }
});

test("malformed tokens are rejected without throwing", async () => {
  for (const token of [
    "",
    "not.a.jwt",
    "a.b",
    "a.b.c.d",
    `${base64url("{}")}.${base64url("{}")}.${base64url("sig")}`,
  ]) {
    const identity = await verifyTelegramLoginIdToken(
      token,
      { clientId: CLIENT_ID, nonceHash: NONCE_HASH, now: NOW },
      fetcher()
    );
    assert.equal(identity, null);
  }
});

test("a token signed by an unknown key is rejected", async () => {
  const other = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const header = base64url(
    JSON.stringify({ alg: "RS256", kid: "other-kid", typ: "JWT" })
  );
  const payload = base64url(JSON.stringify(baseClaims()));
  const signature = sign(
    "RSA-SHA256",
    Buffer.from(`${header}.${payload}`),
    other.privateKey
  );

  const identity = await verifyTelegramLoginIdToken(
    `${header}.${payload}.${base64url(signature)}`,
    { clientId: CLIENT_ID, nonceHash: NONCE_HASH, now: NOW },
    fetcher()
  );

  assert.equal(identity, null);
});
