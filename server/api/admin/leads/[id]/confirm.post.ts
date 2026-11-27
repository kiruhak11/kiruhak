import { encodeLeadConfirmation, failedLeadVersion, isLeadMessageIdInUse, parseLeadMessageId } from "../../../../utils/lead-confirmation";
import { prisma } from "../../../../utils/prisma";
import { requireAdmin } from "../../../../utils/require-admin";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "private, no-store");
  const user = event.context.user as { id: string; isAdmin: boolean } | undefined;
  const admin = requireAdmin(user);

  const id = getRouterParam(event, "id");
  if (!id || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid lead ID" });
  }

  const body = await readBody<{ updatedAt?: unknown; checkedTelegram?: unknown; messageId?: unknown }>(event);
  const version = typeof body?.updatedAt === "string" ? Date.parse(body.updatedAt) : NaN;
  const messageId = parseLeadMessageId(body?.messageId);
  if (!Number.isFinite(version) || !messageId || body?.checkedTelegram !== true) {
    throw createError({ statusCode: 400, statusMessage: "Lead version, Telegram confirmation and message ID are required" });
  }

  return prisma.$transaction(async tx => {
    if (await isLeadMessageIdInUse(tx, messageId)) {
      throw createError({ statusCode: 409, statusMessage: "Telegram message ID is already recorded" });
    }

    const where = failedLeadVersion(id, version);
    const lead = await tx.leadDelivery.findFirst({
      where,
      select: { lastErrorCode: true },
    });

    if (!lead) {
      throw createError({ statusCode: 409, statusMessage: "Lead changed or cannot be confirmed" });
    }

    const now = new Date();
    const updated = await tx.leadDelivery.updateMany({
      where: { ...where, lastErrorCode: lead.lastErrorCode },
      data: {
        status: "SENT",
        sentAt: now,
        telegramMessageId: messageId,
        lastErrorCode: encodeLeadConfirmation({
          adminId: admin.id,
          confirmedAt: now.toISOString(),
          previousErrorCode: lead.lastErrorCode,
        }),
      },
    });
    if (!updated.count) {
      throw createError({ statusCode: 409, statusMessage: "Lead changed or cannot be confirmed" });
    }

    return { status: "SENT", messageId: messageId.toString() };
  });
});
