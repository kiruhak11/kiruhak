import { readFileSync } from "node:fs";
import { fetch, ProxyAgent } from "undici";

const TELEGRAM_HOSTS = new Set(["api.telegram.org", "oauth.telegram.org"]);
const TELEGRAM_BOT_METHODS = new Set(["sendMessage", "getMe", "getChatMember"]);
const TELEGRAM_OIDC_PATHS = new Set([
  "/auth",
  "/token",
  "/.well-known/openid-configuration",
  "/.well-known/jwks.json",
]);

let currentProxyUrl = "";
let currentProxyAgent: ProxyAgent | undefined;

type TelegramFetchInit = NonNullable<Parameters<typeof fetch>[1]>;
type TelegramFetchResponse = Awaited<ReturnType<typeof fetch>>;

export class TelegramTransportError extends Error {
  constructor(public code: string) {
    super(`Telegram transport error: ${code}`);
    this.name = "TelegramTransportError";
  }
}

function readProxyUrl(): string {
  const secretPath =
    process.env.TELEGRAM_PROXY_URL_FILE?.trim() ||
    "/run/secrets/telegram_proxy_url";
  try {
    return readFileSync(secretPath, "utf8").trim();
  } catch {
    throw new TelegramTransportError("PROXY_NOT_CONFIGURED");
  }
}

function getProxyAgent(): ProxyAgent {
  const proxyUrl = readProxyUrl();

  let parsed: URL;
  try {
    parsed = new URL(proxyUrl);
  } catch {
    throw new TelegramTransportError("INVALID_PROXY");
  }

  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    !parsed.hostname ||
    !parsed.port ||
    !parsed.username ||
    !parsed.password ||
    (parsed.pathname !== "/" && parsed.pathname !== "") ||
    parsed.search ||
    parsed.hash
  ) {
    throw new TelegramTransportError("INVALID_PROXY");
  }

  if (currentProxyUrl !== proxyUrl || !currentProxyAgent) {
    const previous = currentProxyAgent;
    currentProxyUrl = proxyUrl;
    currentProxyAgent = new ProxyAgent({
      uri: proxyUrl,
      proxyTls: { rejectUnauthorized: true },
      requestTls: { rejectUnauthorized: true },
    });
    if (previous) void previous.close().catch(() => void 0);
  }

  return currentProxyAgent;
}

export function validateTelegramEndpoint(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new TelegramTransportError("INVALID_ENDPOINT");
  }

  const allowedBotMethod =
    url.hostname === "api.telegram.org" &&
    /^\/bot[0-9]+:[A-Za-z0-9_-]+\/(sendMessage|getMe|getChatMember)$/.test(
      url.pathname
    ) &&
    TELEGRAM_BOT_METHODS.has(url.pathname.split("/").at(-1) || "");
  const allowedOidcPath =
    url.hostname === "oauth.telegram.org" &&
    TELEGRAM_OIDC_PATHS.has(url.pathname);

  if (
    url.protocol !== "https:" ||
    !TELEGRAM_HOSTS.has(url.hostname) ||
    (!allowedBotMethod && !allowedOidcPath) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new TelegramTransportError("INVALID_ENDPOINT");
  }

  return url;
}

export async function telegramFetch(
  input: string,
  init: TelegramFetchInit = {}
): Promise<TelegramFetchResponse> {
  const url = validateTelegramEndpoint(input);
  const agent = getProxyAgent();

  try {
    return await fetch(url, {
      ...init,
      dispatcher: agent,
      redirect: "error" as const,
      signal: init.signal ?? AbortSignal.timeout(8000),
    } as TelegramFetchInit);
  } catch {
    throw new TelegramTransportError("REQUEST_FAILED");
  }
}

export function telegramBotApiUrl(token: string, method: string): URL {
  if (!token || !TELEGRAM_BOT_METHODS.has(method)) {
    throw new TelegramTransportError("INVALID_ENDPOINT");
  }
  return validateTelegramEndpoint(
    `https://api.telegram.org/bot${token}/${method}`
  );
}
