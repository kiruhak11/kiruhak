import { readFileSync } from "node:fs";

export interface TelegramLoginCredentials {
  clientId: string;
  clientSecret: string;
}

function readSecret(pathEnv: string, defaultPath: string): string {
  const secretPath = process.env[pathEnv]?.trim() || defaultPath;
  try {
    return readFileSync(secretPath, "utf8").trim();
  } catch {
    return "";
  }
}

export function getTelegramBotToken(): string {
  return readSecret(
    "TELEGRAM_BOT_TOKEN_FILE",
    "/run/secrets/telegram_bot_token"
  );
}

export function getTelegramLoginCredentials(): TelegramLoginCredentials {
  return {
    clientId: getTelegramLoginClientId(),
    clientSecret: readSecret(
      "TELEGRAM_LOGIN_CLIENT_SECRET_FILE",
      "/run/secrets/telegram_login_client_secret"
    ),
  };
}

export function getTelegramLoginClientId(): string {
  return readSecret(
    "TELEGRAM_LOGIN_CLIENT_ID_FILE",
    "/run/secrets/telegram_login_client_id"
  );
}
