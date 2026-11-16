import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TelegramTransportError,
  telegramBotApiUrl,
  telegramFetch,
  validateTelegramEndpoint,
} from "../server/utils/telegram-http";

test("only known Telegram bot API methods and OIDC paths are accepted", () => {
  const allowed = [
    "https://api.telegram.org/bot123456:AAH/sendMessage",
    "https://api.telegram.org/bot123456:AAH/getMe",
    "https://api.telegram.org/bot123456:AAH/getChatMember",
    "https://oauth.telegram.org/auth",
    "https://oauth.telegram.org/token",
    "https://oauth.telegram.org/.well-known/openid-configuration",
    "https://oauth.telegram.org/.well-known/jwks.json",
  ];

  for (const url of allowed) {
    assert.equal(validateTelegramEndpoint(url).href, url);
  }
});

test("telegram endpoints outside the allow-list are rejected", () => {
  const rejected = [
    "http://api.telegram.org/bot123456:AAH/getMe",
    "https://evil.example/bot123456:AAH/getMe",
    "https://api.telegram.org/bot123456:AAH/deleteMessage",
    "https://api.telegram.org/botnot-a-token/getMe",
    "https://oauth.telegram.org/other",
    "https://user:pass@api.telegram.org/bot123456:AAH/getMe",
    "https://api.telegram.org/bot123456:AAH/getMe?x=1",
    "https://api.telegram.org/bot123456:AAH/getMe#f",
    "not-a-url",
  ];

  for (const url of rejected) {
    assert.throws(
      () => validateTelegramEndpoint(url),
      (error: unknown) =>
        error instanceof TelegramTransportError &&
        error.code === "INVALID_ENDPOINT",
      `expected ${url} to be rejected`
    );
  }
});

test("bot API URL builder rejects unknown methods and empty tokens", () => {
  assert.equal(
    telegramBotApiUrl("123456:AAH", "sendMessage").href,
    "https://api.telegram.org/bot123456:AAH/sendMessage"
  );
  assert.throws(() => telegramBotApiUrl("", "sendMessage"), TelegramTransportError);
  assert.throws(
    () => telegramBotApiUrl("123456:AAH", "deleteMessage"),
    TelegramTransportError
  );
});

test("telegram requests fail closed when the proxy is not configured", async () => {
  const previous = process.env.TELEGRAM_PROXY_URL_FILE;
  process.env.TELEGRAM_PROXY_URL_FILE =
    "/run/secrets/telegram_proxy_url_that_is_absent";
  try {
    await assert.rejects(
      () => telegramFetch("https://api.telegram.org/bot123456:AAH/getMe"),
      (error: unknown) =>
        error instanceof TelegramTransportError &&
        error.code === "PROXY_NOT_CONFIGURED"
    );
  } finally {
    if (previous === undefined) delete process.env.TELEGRAM_PROXY_URL_FILE;
    else process.env.TELEGRAM_PROXY_URL_FILE = previous;
  }
});
