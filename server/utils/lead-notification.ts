import { telegramBotApiUrl, telegramFetch } from "./telegram-http";

export type LeadNotificationLead = {
  name: string;
  contact?: string | null;
  email: string;
  business?: string | null;
  task: string;
  budget?: string | null;
};

export type LeadTelegramResult = {
  ok?: boolean;
  result?: { message_id?: number };
};

export type LeadTelegramResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<LeadTelegramResult>;
};

export type LeadTelegramSender = (
  input: string | URL,
  init: Parameters<typeof telegramFetch>[1]
) => Promise<LeadTelegramResponse>;

const defaultSender: LeadTelegramSender = async (input, init) => {
  const response = await telegramFetch(String(input), init);

  return {
    ok: response.ok,
    status: response.status,
    json: async () => (await response.json()) as LeadTelegramResult,
  };
};

/** Текст уведомления о новой заявке для администратора. */
function formatLeadMessage(lead: LeadNotificationLead, createdAt: Date): string {
  const lines: string[] = [
    "📩 Новая заявка — K-Studio",
    "",
    `Дата и время: ${createdAt.toISOString()}`,
    `Имя: ${lead.name}`,
  ];

  if (lead.contact) {
    lines.push(`Telegram или телефон: ${lead.contact}`);
  }

  lines.push(`Email: ${lead.email}`);

  if (lead.business) {
    lines.push(`Ниша / компания: ${lead.business}`);
  }

  lines.push(`Задача: ${lead.task}`);

  if (lead.budget) {
    lines.push(`Ориентировочный бюджет: ${lead.budget}`);
  }

  return lines.join("\n").slice(0, 6000);
}

/** Экспоненциальная задержка перед следующей попыткой доставки (секунды). */
export function retryDelaySeconds(attempt: number): number {
  return Math.min(3600, 30 * 2 ** Math.max(0, attempt - 1));
}

/**
 * Отправляет заявку в Telegram.
 * Бросает Error с кодом TELEGRAM_RATE_LIMIT, TELEGRAM_HTTP_<status> или TELEGRAM_REJECTED.
 */
export async function sendLeadNotification(
  lead: LeadNotificationLead,
  createdAt: Date,
  recipient: string,
  token: string,
  sender: LeadTelegramSender = defaultSender
): Promise<{ messageId: bigint | null }> {
  const response = await sender(telegramBotApiUrl(token, "sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: recipient,
      text: formatLeadMessage(lead, createdAt),
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    throw new Error(
      response.status === 429
        ? "TELEGRAM_RATE_LIMIT"
        : `TELEGRAM_HTTP_${response.status}`
    );
  }

  const result = await response.json();

  if (!result.ok) {
    throw new Error("TELEGRAM_REJECTED");
  }

  return {
    messageId:
      typeof result.result?.message_id === "number"
        ? BigInt(result.result.message_id)
        : null,
  };
}
