import { prisma } from "../utils/prisma";
import { LEAD_MAX_ATTEMPTS } from "../utils/lead-delivery";
import {
  retryDelaySeconds,
  sendLeadNotification,
  type LeadNotificationLead,
} from "../utils/lead-notification";
import { getTelegramBotToken } from "../utils/telegram-config";

type LeadDeliveryRow = LeadNotificationLead & {
  id: string;
  attempt_count: number;
  created_at: Date;
};

let running = false;
let warnedUnavailable = false;
let warnedSenderConfig = false;
let lastFingerprintCleanupAt = 0;

/** Захватывает одну заявку в статусе PENDING/RETRY под блокировкой на 45 секунд. */
async function claimOne(): Promise<LeadDeliveryRow | null> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<LeadDeliveryRow[]>`
      WITH candidate AS (
        SELECT id FROM lead_deliveries
        WHERE status IN ('PENDING', 'RETRY')
          AND next_attempt_at <= NOW()
          AND (locked_until IS NULL OR locked_until < NOW())
          AND attempt_count < ${LEAD_MAX_ATTEMPTS}
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE lead_deliveries AS lead
      SET locked_until = NOW() + INTERVAL '45 seconds',
          attempt_count = lead.attempt_count + 1,
          updated_at = NOW()
      FROM candidate
      WHERE lead.id = candidate.id
      RETURNING lead.id, lead.name, lead.contact, lead.email, lead.business, lead.task,
        lead.budget, lead.attempt_count, lead.created_at
    `;

    return rows[0] || null;
  });
}

/** Переводит заявки с исчерпанными попытками в FAILED. */
async function finalizeExpiredLeases(): Promise<void> {
  await prisma.$executeRaw`
    UPDATE lead_deliveries SET status = 'FAILED', locked_until = NULL,
      last_error_code = 'WORKER_LEASE_EXHAUSTED', updated_at = NOW()
    WHERE status IN ('PENDING', 'RETRY') AND attempt_count >= ${LEAD_MAX_ATTEMPTS}
      AND (locked_until IS NULL OR locked_until < NOW())
  `;
}

/** Доставляет одну заявку в Telegram и фиксирует результат. */
async function deliverOne(): Promise<void> {
  const token = getTelegramBotToken();
  const config = useRuntimeConfig() as { adminTelegramId?: string };
  const recipient = String(
    config.adminTelegramId ||
      process.env.NUXT_ADMIN_TELEGRAM_ID ||
      process.env.ADMIN_TELEGRAM_ID ||
      ""
  ).trim();

  if (!token || !/^\d{1,24}$/.test(recipient)) {
    if (!warnedSenderConfig) {
      console.error(
        "[lead-delivery] sender configuration unavailable; queued requests remain persisted"
      );
      warnedSenderConfig = true;
    }
    return;
  }

  warnedSenderConfig = false;

  await finalizeExpiredLeases();

  const lead = await claimOne();

  if (!lead) {
    return;
  }

  try {
    const result = await sendLeadNotification(
      lead,
      lead.created_at,
      recipient,
      token
    );

    await prisma.$executeRaw`
      UPDATE lead_deliveries SET status = 'SENT', sent_at = NOW(), locked_until = NULL,
        telegram_message_id = ${result.messageId},
        last_error_code = NULL, updated_at = NOW() WHERE id = ${lead.id}
    `;
  } catch (error) {
    const code =
      error instanceof Error && /^(TELEGRAM_[A-Z0-9_]+)$/.test(error.message)
        ? error.message
        : error && typeof error === "object" && "code" in error
          ? String(error.code).slice(0, 40)
          : "TRANSPORT_ERROR";

    await markFailure(lead.id, lead.attempt_count, code);
  }
}

/** Очищает отпечатки клиентов старше 24 часов. */
async function cleanupExpiredFingerprints(): Promise<void> {
  if (Date.now() - lastFingerprintCleanupAt < 60 * 60 * 1e3) {
    return;
  }

  await prisma.$executeRaw`
    UPDATE lead_deliveries SET client_fingerprint = NULL
    WHERE client_fingerprint IS NOT NULL AND created_at < NOW() - INTERVAL '24 hours'
  `;

  lastFingerprintCleanupAt = Date.now();
}

/** Фиксирует неудачную попытку: FAILED либо RETRY с отложенной попыткой. */
async function markFailure(
  id: string,
  attempt: number,
  errorCode: string
): Promise<void> {
  if (attempt >= LEAD_MAX_ATTEMPTS) {
    await prisma.$executeRaw`
      UPDATE lead_deliveries SET status = 'FAILED', locked_until = NULL,
        last_error_code = ${errorCode}, updated_at = NOW() WHERE id = ${id}
    `;
    return;
  }

  const delaySeconds = retryDelaySeconds(attempt);

  await prisma.$executeRaw`
    UPDATE lead_deliveries SET status = 'RETRY', locked_until = NULL,
      next_attempt_at = NOW() + (${delaySeconds} * INTERVAL '1 second'),
      last_error_code = ${errorCode}, updated_at = NOW() WHERE id = ${id}
  `;
}

export default defineNitroPlugin((nitroApp) => {
  const tick = async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      await cleanupExpiredFingerprints();
      await deliverOne();
      warnedUnavailable = false;
    } catch {
      if (!warnedUnavailable) {
        console.error(
          "[lead-delivery] worker unavailable; queued requests remain persisted"
        );
        warnedUnavailable = true;
      }
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => void tick(), 1e4);
  timer.unref?.();

  nitroApp.hooks.hook("close", () => clearInterval(timer));

  const firstRun = setTimeout(() => void tick(), 2e3);
  firstRun.unref?.();
});
