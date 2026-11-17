import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { once } from "node:events";
import { test } from "node:test";

/**
 * Интеграционная проверка определения адреса клиента на настоящем
 * Nitro/H3-сервере.
 *
 * Unit-тест с искусственным сокетом не доказывает, что адаптер читает
 * реальное событие h3, поэтому здесь поднимается собранное приложение
 * (`.output/server/index.mjs`) и к нему идут настоящие HTTP-запросы.
 *
 * Требуется собранный образ приложения и доступная база данных.
 * Если сборки нет — тест пропускается (SKIP), а не падает.
 */

const OUTPUT_ENTRY = new URL("../.output/server/index.mjs", import.meta.url);

const EDGE = "81.177.135.137";

const startApp = async (): Promise<{
  port: number;
  stop: () => Promise<void>;
}> => {
  const port = 34100 + Math.floor(Math.random() * 400);
  const child = spawn(process.execPath, [OUTPUT_ENTRY.pathname], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
      HOST: "127.0.0.1",
      NUXT_AUTH_TOKEN_SECRET: "integration-secret-0123456789-0123456789",
      BOT_SECRET: "integration-bot-secret",
      TRUSTED_PROXY_IPS: `${EDGE}/32`,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";
  child.stdout.on("data", (chunk) => {
    output += String(chunk);
  });
  child.stderr.on("data", (chunk) => {
    output += String(chunk);
  });

  const deadline = Date.now() + 40_000;
  while (Date.now() < deadline) {
    if (output.includes("Listening on")) break;
    if (child.exitCode !== null) {
      throw new Error(`приложение завершилось: ${output.slice(-500)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  if (!output.includes("Listening on")) {
    child.kill("SIGTERM");
    throw new Error(`приложение не поднялось: ${output.slice(-500)}`);
  }

  return {
    port,
    stop: async () => {
      child.kill("SIGTERM");
      await once(child, "exit").catch(() => undefined);
    },
  };
};

const post = async (
  port: number,
  path: string,
  headers: Record<string, string>
): Promise<{ status: number; body: string }> => {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: "{}",
  });
  return { status: response.status, body: await response.text() };
};

test(
  "real Nitro server: client identities are isolated and X-Forwarded-For cannot be forged",
  { skip: existsSync(OUTPUT_ENTRY) ? false : "нет собранного приложения (.output)" },
  async () => {
    const app = await startApp();

    try {
      const clientA = { "x-forwarded-for": `203.0.113.10, ${EDGE}` };
      const clientB = { "x-forwarded-for": `198.51.100.20, ${EDGE}` };

      // Клиент A: десять запросов проходят.
      for (let index = 0; index < 10; index += 1) {
        const response = await post(app.port, "/api/auth/login", clientA);
        assert.notEqual(
          response.status,
          429,
          `запрос ${index + 1} клиента A не должен отклоняться`
        );
      }

      // Одиннадцатый запрос клиента A отклоняется.
      const blocked = await post(app.port, "/api/auth/login", clientA);
      assert.equal(blocked.status, 429);
      assert.match(
        blocked.body,
        /retryAfter/i,
        "ответ 429 должен содержать время повтора"
      );

      // Клиент B имеет независимый лимит.
      const firstB = await post(app.port, "/api/auth/login", clientB);
      assert.notEqual(
        firstB.status,
        429,
        "у клиента B должен быть собственный счётчик"
      );

      // Поддельный X-Forwarded-For не меняет идентичность клиента A:
      // подделанный адрес добавлен слева, реальный остаётся тем же.
      const spoofed = await post(app.port, "/api/auth/login", {
        "x-forwarded-for": `1.2.3.4, 203.0.113.10, ${EDGE}`,
      });
      assert.equal(
        spoofed.status,
        429,
        "подмена X-Forwarded-For не должна сбрасывать лимит клиента A"
      );

      // Цепочка без доверенного последнего хопа не принимается: клиент
      // получает безопасный общий адрес соединения, а не заявленный.
      const untrusted = await post(app.port, "/api/auth/login", {
        "x-forwarded-for": "203.0.113.99",
      });
      assert.notEqual(
        untrusted.status,
        429,
        "цепочка без доверенного прокси не должна попадать в счётчик клиента A"
      );
    } finally {
      await app.stop();
    }
  }
);
