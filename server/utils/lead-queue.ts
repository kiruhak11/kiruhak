import { isLeadMessageIdInUse } from "./lead-confirmation";
import { LEAD_MAX_ATTEMPTS } from "./lead-delivery";
import {
  LEAD_SEND_TIMEOUT_MS,
  LeadNotificationError,
  retryDelaySeconds,
  sendLeadNotification,
  type LeadNotificationLead,
} from "./lead-notification";
import { prisma } from "./prisma";

type ClaimedLead = LeadNotificationLead & {
  attempt_count: number;
  created_at: Date;
  locked_until: Date;
};

export async function recoverLeadQueue() {
  // An expired lease may already have sent a message. Surface it for review
  // instead of automatically sending another copy.
  await prisma.$executeRaw`
    UPDATE lead_deliveries
    SET status = 'FAILED', locked_until = NULL,
      last_error_code = CASE
        WHEN locked_until IS NOT NULL THEN 'WORKER_LEASE_UNCONFIRMED'
        ELSE 'WORKER_LEASE_EXHAUSTED'
      END,
      updated_at = clock_timestamp()
    WHERE status IN ('PENDING', 'RETRY') AND sent_at IS NULL AND telegram_message_id IS NULL
      AND (locked_until <= NOW() OR (locked_until IS NULL AND attempt_count >= ${LEAD_MAX_ATTEMPTS}))
  `;
}

async function claimLead(): Promise<ClaimedLead | undefined> {
  const rows = await prisma.$queryRaw<ClaimedLead[]>`
    WITH candidate AS (
      SELECT id FROM lead_deliveries
      WHERE status IN ('PENDING', 'RETRY') AND next_attempt_at <= NOW()
        AND locked_until IS NULL AND attempt_count < ${LEAD_MAX_ATTEMPTS}
        AND sent_at IS NULL AND telegram_message_id IS NULL
      ORDER BY next_attempt_at, created_at, id
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    UPDATE lead_deliveries AS lead
    SET locked_until = date_trunc('milliseconds', clock_timestamp() + INTERVAL '45 seconds'),
        attempt_count = lead.attempt_count + 1, updated_at = clock_timestamp()
    FROM candidate WHERE lead.id = candidate.id
    RETURNING lead.id, lead.name, lead.contact, lead.email, lead.business, lead.task,
      lead.budget, lead.attempt_count, lead.created_at, lead.locked_until
  `;
  return rows[0];
}

export async function deliverQueuedLead(recipient: string, token: string) {
  const lead = await claimLead();
  if (!lead || Date.now() + LEAD_SEND_TIMEOUT_MS >= lead.locked_until.getTime()) return;

  let messageId: bigint;
  try {
    ({ messageId } = await sendLeadNotification(lead, lead.created_at, recipient, token));
  } catch (error) {
    const failure = error instanceof LeadNotificationError
      ? error
      : new LeadNotificationError("TELEGRAM_DELIVERY_UNCONFIRMED");
    const safeToRetry = failure.code === "TELEGRAM_RATE_LIMIT" || failure.code === "TELEGRAM_PROXY_NOT_CONFIGURED";
    const canRetry = safeToRetry && lead.attempt_count < LEAD_MAX_ATTEMPTS;
    const delay = Math.max(retryDelaySeconds(lead.attempt_count), failure.retryAfterSeconds ?? 0);

    await prisma.$executeRaw`
      UPDATE lead_deliveries SET status = ${canRetry ? "RETRY" : "FAILED"}, locked_until = NULL,
        next_attempt_at = NOW() + (${delay} * INTERVAL '1 second'),
        last_error_code = ${failure.code}, updated_at = clock_timestamp()
      WHERE id = ${lead.id} AND locked_until = ${lead.locked_until} AND attempt_count = ${lead.attempt_count}
    `;
    return;
  }

  // A database error after Telegram accepts the message must never schedule another send.
  await prisma.$transaction(async tx => {
    if (await isLeadMessageIdInUse(tx, messageId)) {
      await tx.$executeRaw`
        UPDATE lead_deliveries SET status = 'FAILED', locked_until = NULL,
          last_error_code = 'TELEGRAM_MESSAGE_ID_CONFLICT_UNCONFIRMED', updated_at = clock_timestamp()
        WHERE id = ${lead.id} AND locked_until = ${lead.locked_until} AND attempt_count = ${lead.attempt_count}
      `;
      return;
    }

    await tx.$executeRaw`
      UPDATE lead_deliveries SET status = 'SENT', sent_at = NOW(), locked_until = NULL,
        telegram_message_id = ${messageId}, last_error_code = NULL, updated_at = clock_timestamp()
      WHERE id = ${lead.id} AND locked_until = ${lead.locked_until} AND attempt_count = ${lead.attempt_count}
    `;
  });
}
