import { createHash } from "node:crypto";
import { LEAD_FIELD_LIMITS, validateLeadFields, type LeadField } from "../../utils/lead-fields";
import { resolveClientIp } from "./client-ip";

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

export type LeadInput = {
  name: string;
  contact?: string;
  email?: string;
  business?: string;
  task: string;
  budget?: string;
};


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

  for (const key of Object.keys(LEAD_FIELD_LIMITS) as LeadField[]) {
    const raw = source[key];

    if (raw !== undefined && typeof raw !== "string") {
      throw new Error("INVALID_INPUT");
    }

    const text = typeof raw === "string" ? raw.trim() : "";

    if (text.length > LEAD_FIELD_LIMITS[key]) {
      throw new Error("FIELD_TOO_LONG");
    }

    if (text) {
      result[key] = text;
    }
  }

  if (!result.name || !(result.email || result.contact) || !result.task) {
    throw new Error("REQUIRED_FIELDS");
  }

  const errors = validateLeadFields(result);
  if (errors.email) throw new Error("INVALID_EMAIL");
  if (errors.contact) throw new Error("INVALID_CONTACT");

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
  return resolveClientIp(event).address;
}
