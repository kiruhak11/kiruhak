import { TelegramTransportError, telegramBotApiUrl, telegramFetch } from "./telegram-http";

export type LeadNotificationLead = {
  id: string;
  name: string;
  contact?: string | null;
  email: string;
  business?: string | null;
  task: string;
  budget?: string | null;
};

type LeadTelegramResponse = Pick<Awaited<ReturnType<typeof telegramFetch>>, "status" | "ok" | "json">;
type LeadTelegramSender = (
  url: string,
  init: Parameters<typeof telegramFetch>[1]
) => Promise<LeadTelegramResponse>;

export class LeadNotificationError extends Error {
  constructor(public code: string, public retryAfterSeconds?: number) {
    super(code);
  }
}

export const LEAD_SEND_TIMEOUT_MS = 8000;
const TELEGRAM_TEXT_LIMIT = 4096;
const FULL_TASK_NOTE = "\n\nПродолжение в админке → Заявки.";

export function formatLeadMessage(lead: LeadNotificationLead, createdAt: Date): string {
  const lines = [
    "📩 Новая заявка — K-Studio",
    `ID заявки: ${lead.id}`,
    `Дата и время: ${createdAt.toISOString()}`,
    "",
    `Имя: ${lead.name}`,
    `Email: ${lead.email}`,
  ];

  if (lead.contact) lines.push(`Telegram или телефон: ${lead.contact}`);
  if (lead.business) lines.push(`Ниша / компания: ${lead.business}`);
  if (lead.budget) lines.push(`Ориентировочный бюджет: ${lead.budget}`);

  const prefix = lines.join("\n") + "\n\nЗадача: ";
  if (prefix.length + lead.task.length <= TELEGRAM_TEXT_LIMIT) return prefix + lead.task;

  const preview = (prefix + lead.task).slice(0, TELEGRAM_TEXT_LIMIT - FULL_TASK_NOTE.length)
    .replace(/[\uD800-\uDBFF]$/, "");
  return preview + FULL_TASK_NOTE;
}

export function retryDelaySeconds(attempt: number): number {
  return Math.min(3600, 30 * 2 ** Math.max(0, attempt - 1));
}

export async function sendLeadNotification(
  lead: LeadNotificationLead,
  createdAt: Date,
  recipient: string,
  token: string,
  sender: LeadTelegramSender = telegramFetch
): Promise<{ messageId: bigint }> {
  const signal = AbortSignal.timeout(LEAD_SEND_TIMEOUT_MS);
  let response: LeadTelegramResponse;
  try {
    response = await sender(telegramBotApiUrl(token, "sendMessage").href, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: recipient,
        text: formatLeadMessage(lead, createdAt),
        disable_web_page_preview: true,
      }),
      signal,
    });
  } catch (error) {
    if (error instanceof TelegramTransportError && error.code !== "REQUEST_FAILED") {
      throw new LeadNotificationError(`TELEGRAM_${error.code}`);
    }
    throw new LeadNotificationError(signal.aborted ? "TELEGRAM_TIMEOUT_UNCONFIRMED" : "TELEGRAM_DELIVERY_UNCONFIRMED");
  }

  const result = await response.json().catch(() => null) as {
    ok?: unknown;
    result?: { message_id?: unknown };
    parameters?: { retry_after?: unknown };
  } | null;

  if (response.status === 429) {
    const seconds = result?.parameters?.retry_after;
    throw new LeadNotificationError(
      "TELEGRAM_RATE_LIMIT",
      typeof seconds === "number" && Number.isSafeInteger(seconds) && seconds > 0 && seconds <= 2147483647
        ? seconds
        : undefined
    );
  }

  if (response.status >= 400 && response.status < 500 && response.status !== 408) {
    throw new LeadNotificationError(`TELEGRAM_HTTP_${response.status}`);
  }

  const messageId = result?.result?.message_id;
  if (response.ok && result?.ok === true && typeof messageId === "number" && Number.isSafeInteger(messageId) && messageId > 0) {
    return { messageId: BigInt(messageId) };
  }
  if (response.ok && result?.ok === false) {
    throw new LeadNotificationError("TELEGRAM_REJECTED");
  }
  throw new LeadNotificationError(
    signal.aborted || response.status === 408 ? "TELEGRAM_TIMEOUT_UNCONFIRMED" : "TELEGRAM_DELIVERY_UNCONFIRMED"
  );
}
