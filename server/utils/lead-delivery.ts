import { createHash } from "node:crypto";
import { resolveClientIp, trustedProxiesFromEnv } from "./client-ip";

/**
 * Тип события берём из сигнатуры авто-импортируемого h3-хелпера:
 * пакет h3 не поднят в корень node_modules и не является прямой зависимостью.
 */
type LeadRequestEvent = Parameters<typeof getHeader>[0];

/** Максимальный размер тела заявки (16 КБ). */
export const LEAD_MAX_BODY_BYTES = 16 * 1024;

/** Максимум заявок от одного клиента за окно ограничения частоты. */
export const LEAD_RATE_LIMIT = 5;

/** Окно ограничения частоты заявок (минуты). */
export const LEAD_RATE_WINDOW_MINUTES = 15;

/** Максимальное количество попыток доставки заявки. */
export const LEAD_MAX_ATTEMPTS = 6;

const limits = {
  name: 120,
  contact: 160,
  email: 254,
  business: 180,
  task: 4000,
  budget: 160,
};

export type LeadInput = {
  name: string;
  contact?: string;
  email: string;
  business?: string;
  task: string;
  budget?: string;
};

type LeadField = keyof typeof limits;

/**
 * Проверяет и нормализует полезную нагрузку заявки.
 * Бросает Error с кодом INVALID_INPUT, FIELD_TOO_LONG, REQUIRED_FIELDS или INVALID_EMAIL.
 */
export function validateLeadInput(value: unknown): LeadInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("INVALID_INPUT");
  }

  const source = value as Record<string, unknown>;
  const result: Partial<Record<LeadField, string>> = {};

  for (const key of Object.keys(limits) as LeadField[]) {
    const raw = source[key];

    if (raw !== undefined && typeof raw !== "string") {
      throw new Error("INVALID_INPUT");
    }

    const text = typeof raw === "string" ? raw.trim() : "";

    if (text.length > limits[key]) {
      throw new Error("FIELD_TOO_LONG");
    }

    if (text) {
      result[key] = text;
    }
  }

  if (!result.name || !result.email || !result.task) {
    throw new Error("REQUIRED_FIELDS");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) {
    throw new Error("INVALID_EMAIL");
  }

  return result as LeadInput;
}

/** Стабильный хеш нормализованной заявки (payload_hash). */
export function leadFingerprint(lead: LeadInput): string {
  return createHash("sha256").update(JSON.stringify(lead)).digest("hex");
}

/**
 * Адрес клиента.
 *
 * Forwarded-заголовки учитываются только от доверенного прокси, иначе клиент
 * мог бы подменить адрес и обойти ограничение частоты заявок.
 */
export function getClientAddress(event: LeadRequestEvent): string {
  return resolveClientIp(
    {
      headers: event.headers as unknown as Record<
        string,
        string | string[] | undefined
      >,
      socket: event.node?.req?.socket,
    },
    { trustedProxies: trustedProxiesFromEnv() }
  );
}
