import { randomBytes, createHmac, createHash, timingSafeEqual } from "node:crypto";

const TELEGRAM_LOGIN_OWNER_ID = "502773482";
export const TELEGRAM_LOGIN_RATE_LIMIT_LOCK_SQL =
  "SELECT pg_advisory_xact_lock(hashtext($1))::text AS acquired";
const FLOW_KEY_LENGTH = 24;

export type TelegramLoginMode = "owner_canary" | "public" | "disabled";

export interface TelegramLoginAccount {
  telegramId: string;
  isAdmin: boolean;
}

export interface TelegramLoginTransactionMaterial {
  transaction: string;
  stateHash: string;
  flowKey: string;
  nonce: string;
  nonceHash: string;
  browserSecret: string;
  browserSecretHash: string;
}

export interface TelegramLoginCookieNames {
  browser: string;
}

function parseTelegramLoginMode(value: unknown): TelegramLoginMode {
  return value === "owner_canary" || value === "public" ? value : "disabled";
}

export function getTelegramLoginMode(
  configuredValue?: unknown
): TelegramLoginMode {
  return parseTelegramLoginMode(
    process.env.TELEGRAM_LOGIN_MODE ?? configuredValue
  );
}

export function isTelegramLoginEnabled(mode: TelegramLoginMode): boolean {
  return mode !== "disabled";
}

export function isTelegramLoginIdentityAllowed(
  mode: TelegramLoginMode,
  telegramId: string
): boolean {
  if (mode === "owner_canary") return telegramId === TELEGRAM_LOGIN_OWNER_ID;
  return mode === "public" && /^[1-9]\d{0,19}$/.test(telegramId);
}

export function isTelegramLoginAccountAllowed(
  mode: TelegramLoginMode,
  account: TelegramLoginAccount
): boolean {
  if (mode === "owner_canary") return account.isAdmin === true;
  return mode === "public";
}

export async function claimSingleUseOperation(
  operation: () => Promise<{ count: number }>
): Promise<boolean> {
  return (await operation()).count === 1;
}

async function findUniqueTelegramAccount<T extends TelegramLoginAccount>(
  telegramId: string,
  findMany: (telegramId: string) => Promise<T[]>
): Promise<T | null> {
  if (!/^[1-9]\d{0,19}$/.test(telegramId)) return null;
  const matches = await findMany(telegramId);
  return matches.length === 1 ? matches[0] : null;
}

export async function resolveTelegramLoginAccount<T extends TelegramLoginAccount>(
  mode: TelegramLoginMode,
  telegramId: string,
  findMany: (telegramId: string) => Promise<T[]>
): Promise<T | null> {
  if (!isTelegramLoginIdentityAllowed(mode, telegramId)) return null;
  return findUniqueTelegramAccount(telegramId, findMany);
}

export function sha256TelegramLoginValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function createTelegramLoginTransactionMaterial(): TelegramLoginTransactionMaterial {
  const transaction = randomBytes(32).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  const browserSecret = randomBytes(32).toString("base64url");
  const stateHash = sha256TelegramLoginValue(transaction);

  return {
    transaction,
    stateHash,
    flowKey: stateHash.slice(0, FLOW_KEY_LENGTH),
    nonce,
    nonceHash: sha256TelegramLoginValue(nonce),
    browserSecret,
    browserSecretHash: sha256TelegramLoginValue(browserSecret),
  };
}

export function telegramLoginCookieNames(
  flowKey: string
): TelegramLoginCookieNames {
  if (!new RegExp(`^[a-f0-9]{${FLOW_KEY_LENGTH}}$`).test(flowKey)) {
    throw new Error("Invalid Telegram login flow key");
  }
  return { browser: `__Secure-kstudio_tg_${flowKey}` };
}

export function constantTimeHexEquals(
  value: string,
  expectedHex: string
): boolean {
  if (!/^[a-f0-9]{64}$/.test(expectedHex)) return false;
  const actual = Buffer.from(sha256TelegramLoginValue(value), "hex");
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function getTelegramLoginOrigin(siteUrl: string): string | null {
  try {
    const parsed = new URL(siteUrl);
    const isLocalHttp =
      parsed.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);

    if (
      (parsed.protocol !== "https:" && !isLocalHttp) ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

export function getClientKeyHash(input: {
  ip: string;
  secret: string;
}): string {
  return createHmac("sha256", input.secret)
    .update(input.ip || "unknown")
    .digest("hex");
}
