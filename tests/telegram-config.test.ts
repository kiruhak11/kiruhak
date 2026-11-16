import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  getTelegramBotToken,
  getTelegramLoginClientId,
  getTelegramLoginCredentials,
} from "../server/utils/telegram-config";

function withSecretFile(
  envName: string,
  contents: string,
  run: (path: string) => void
) {
  const dir = mkdtempSync(join(tmpdir(), "kstudio-telegram-config-"));
  const path = join(dir, "secret");
  writeFileSync(path, contents, "utf8");
  const previous = process.env[envName];
  process.env[envName] = path;
  try {
    run(path);
  } finally {
    if (previous === undefined) delete process.env[envName];
    else process.env[envName] = previous;
  }
}

test("telegram bot token is read from the mounted secret file", () => {
  withSecretFile("TELEGRAM_BOT_TOKEN_FILE", "123456:bot-token\n", () => {
    assert.equal(getTelegramBotToken(), "123456:bot-token");
  });
});

test("telegram login credentials are read from separate secret files", () => {
  withSecretFile("TELEGRAM_LOGIN_CLIENT_ID_FILE", "client-id-value\n", () => {
    withSecretFile(
      "TELEGRAM_LOGIN_CLIENT_SECRET_FILE",
      "client-secret-value\n",
      () => {
        assert.equal(getTelegramLoginClientId(), "client-id-value");
        assert.deepEqual(getTelegramLoginCredentials(), {
          clientId: "client-id-value",
          clientSecret: "client-secret-value",
        });
      }
    );
  });
});

test("missing or unreadable secret files yield an empty value instead of throwing", () => {
  withSecretFile("TELEGRAM_BOT_TOKEN_FILE", "", () => {
    const previous = process.env.TELEGRAM_BOT_TOKEN_FILE;
    process.env.TELEGRAM_BOT_TOKEN_FILE = join(
      tmpdir(),
      "kstudio-missing-secret-file-that-does-not-exist"
    );
    try {
      assert.equal(getTelegramBotToken(), "");
    } finally {
      process.env.TELEGRAM_BOT_TOKEN_FILE = previous;
    }
  });
});
