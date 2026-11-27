import type { Prisma } from "@prisma/client";
import type { LeadManualConfirmation } from "../../types/admin-lead";

const CONFIRMED_PREFIX = "MANUAL_CONFIRMED:";

/**
 * The existing text field carries terminal manual-confirmation metadata.
 * Keep the previous error with the audit record in the same atomic update.
 */
export function encodeLeadConfirmation(audit: LeadManualConfirmation): string {
  return CONFIRMED_PREFIX + JSON.stringify(audit);
}

export function readLeadConfirmation(value: string | null): LeadManualConfirmation | null {
  if (!value?.startsWith(CONFIRMED_PREFIX)) return null;
  try {
    const audit = JSON.parse(value.slice(CONFIRMED_PREFIX.length));
    if (
      typeof audit?.adminId === "string" && audit.adminId &&
      typeof audit.confirmedAt === "string" && Number.isFinite(Date.parse(audit.confirmedAt)) &&
      (typeof audit.previousErrorCode === "string" || audit.previousErrorCode === null)
    ) return audit;
  } catch {
    // Rows written before manual confirmation carry plain error codes.
  }
  return null;
}

export function parseLeadMessageId(value: unknown): bigint | null {
  if (typeof value !== "string" || !/^[1-9]\d{0,18}$/.test(value)) return null;
  const id = BigInt(value);
  return id <= 9223372036854775807n ? id : null;
}

export function failedLeadVersion(id: string, version: number): Prisma.LeadDeliveryWhereInput {
  return {
    id, status: "FAILED", lockedUntil: null, sentAt: null, telegramMessageId: null,
    updatedAt: { gte: new Date(version), lt: new Date(version + 1) },
  };
}

export async function isLeadMessageIdInUse(tx: Prisma.TransactionClient, messageId: bigint): Promise<boolean> {
  // All lead messages use one Telegram chat. Serialize both system and admin
  // acknowledgements for that message ID before looking for another owner.
  await tx.$queryRaw`WITH message_lock AS MATERIALIZED (
    SELECT pg_advisory_xact_lock(hashtextextended(${`lead-message:${messageId}`}, 0))
  ) SELECT 1 FROM message_lock`;
  const existing = await tx.leadDelivery.findFirst({
    where: { telegramMessageId: messageId },
    select: { id: true },
  });
  return Boolean(existing);
}
