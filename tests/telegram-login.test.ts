import assert from "node:assert/strict";
import { test } from "node:test";
import {
  constantTimeHexEquals,
  createTelegramLoginTransactionMaterial,
  getClientKeyHash,
  getTelegramLoginMode,
  getTelegramLoginOrigin,
  isTelegramLoginAccountAllowed,
  isTelegramLoginEnabled,
  isTelegramLoginIdentityAllowed,
  resolveTelegramLoginAccount,
  sha256TelegramLoginValue,
  telegramLoginCookieNames,
} from "../server/utils/telegram-login";

test("telegram login mode falls back to disabled for unknown values", () => {
  const previous = process.env.TELEGRAM_LOGIN_MODE;
  try {
    process.env.TELEGRAM_LOGIN_MODE = "owner_canary";
    assert.equal(getTelegramLoginMode(), "owner_canary");
    process.env.TELEGRAM_LOGIN_MODE = "public";
    assert.equal(getTelegramLoginMode(), "public");
    process.env.TELEGRAM_LOGIN_MODE = "something-else";
    assert.equal(getTelegramLoginMode(), "disabled");
    delete process.env.TELEGRAM_LOGIN_MODE;
    assert.equal(getTelegramLoginMode("public"), "public");
    assert.equal(getTelegramLoginMode("owner_canary"), "owner_canary");
    assert.equal(getTelegramLoginMode("garbage"), "disabled");
  } finally {
    if (previous === undefined) delete process.env.TELEGRAM_LOGIN_MODE;
    else process.env.TELEGRAM_LOGIN_MODE = previous;
  }
});

test("owner_canary restricts telegram login to the owner identity", () => {
  assert.equal(isTelegramLoginEnabled("owner_canary"), true);
  assert.equal(isTelegramLoginEnabled("disabled"), false);
  assert.equal(isTelegramLoginEnabled("public"), true);

  assert.equal(isTelegramLoginIdentityAllowed("owner_canary", "502773482"), true);
  assert.equal(isTelegramLoginIdentityAllowed("owner_canary", "1"), false);
  assert.equal(isTelegramLoginIdentityAllowed("public", "502773482"), true);
  assert.equal(isTelegramLoginIdentityAllowed("public", "0"), false);
  assert.equal(isTelegramLoginIdentityAllowed("public", "abc"), false);
  assert.equal(isTelegramLoginIdentityAllowed("disabled", "502773482"), false);

  assert.equal(
    isTelegramLoginAccountAllowed("owner_canary", {
      telegramId: "502773482",
      isAdmin: true,
    }),
    true
  );
  assert.equal(
    isTelegramLoginAccountAllowed("owner_canary", {
      telegramId: "502773482",
      isAdmin: false,
    }),
    false
  );
  assert.equal(
    isTelegramLoginAccountAllowed("public", {
      telegramId: "1",
      isAdmin: false,
    }),
    true
  );
  assert.equal(
    isTelegramLoginAccountAllowed("disabled", {
      telegramId: "1",
      isAdmin: true,
    }),
    false
  );
});

test("telegram login transaction material is random and hashed", () => {
  const first = createTelegramLoginTransactionMaterial();
  const second = createTelegramLoginTransactionMaterial();

  assert.notEqual(first.transaction, second.transaction);
  assert.notEqual(first.nonce, second.nonce);
  assert.equal(first.stateHash, sha256TelegramLoginValue(first.transaction));
  assert.equal(first.nonceHash, sha256TelegramLoginValue(first.nonce));
  assert.equal(
    first.browserSecretHash,
    sha256TelegramLoginValue(first.browserSecret)
  );
  assert.equal(first.flowKey.length, 24);
  assert.match(first.flowKey, /^[a-f0-9]{24}$/);
});

test("telegram login cookie names are bound to the flow key", () => {
  const material = createTelegramLoginTransactionMaterial();
  assert.deepEqual(telegramLoginCookieNames(material.flowKey), {
    browser: `__Secure-kstudio_tg_${material.flowKey}`,
  });
  assert.throws(() => telegramLoginCookieNames("not-hex"), /Invalid Telegram login flow key/);
  assert.throws(() => telegramLoginCookieNames(""), /Invalid Telegram login flow key/);
});

test("constant time comparison rejects mismatching values", () => {
  const secret = "correct horse battery staple";
  const hash = sha256TelegramLoginValue(secret);

  assert.equal(constantTimeHexEquals(secret, hash), true);
  assert.equal(constantTimeHexEquals("wrong", hash), false);
  assert.equal(constantTimeHexEquals(secret, "not-a-hash"), false);
  assert.equal(constantTimeHexEquals(secret, ""), false);
});

test("telegram login origin only accepts the canonical site origin", () => {
  assert.equal(getTelegramLoginOrigin("https://kiruhak11.ru"), "https://kiruhak11.ru");
  assert.equal(
    getTelegramLoginOrigin("https://kiruhak11.ru/"),
    "https://kiruhak11.ru"
  );
  assert.equal(getTelegramLoginOrigin("http://localhost:3000"), "http://localhost:3000");
  assert.equal(getTelegramLoginOrigin("http://kiruhak11.ru"), null);
  assert.equal(getTelegramLoginOrigin("https://kiruhak11.ru/path"), null);
  assert.equal(getTelegramLoginOrigin("https://user:pass@kiruhak11.ru"), null);
  assert.equal(getTelegramLoginOrigin("not-a-url"), null);
});

test("client key hash is keyed by the caller's secret", () => {
  const first = getClientKeyHash({ ip: "203.0.113.10", secret: "s1" });
  const second = getClientKeyHash({ ip: "203.0.113.10", secret: "s2" });
  const other = getClientKeyHash({ ip: "203.0.113.11", secret: "s1" });

  assert.notEqual(first, second);
  assert.notEqual(first, other);
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(getClientKeyHash({ ip: "", secret: "s1" }).length, 64);
});

test("telegram account resolution requires exactly one unambiguous match", async () => {
  const accounts = [{ telegramId: "502773482", isAdmin: true }];

  const resolved = await resolveTelegramLoginAccount(
    "owner_canary",
    "502773482",
    async () => accounts
  );
  assert.deepEqual(resolved, accounts[0]);

  assert.equal(
    await resolveTelegramLoginAccount("owner_canary", "1", async () => accounts),
    null
  );
  assert.equal(
    await resolveTelegramLoginAccount(
      "owner_canary",
      "502773482",
      async () => []
    ),
    null
  );
  assert.equal(
    await resolveTelegramLoginAccount(
      "owner_canary",
      "502773482",
      async () => [accounts[0], accounts[0]]
    ),
    null
  );
});
