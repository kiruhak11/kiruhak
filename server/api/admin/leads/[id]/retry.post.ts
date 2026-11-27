import { needsLeadDeliveryConfirmation } from "../../../../../types/admin-lead";
import { prisma } from "../../../../utils/prisma";
import { requireAdmin } from "../../../../utils/require-admin";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "private, no-store");
  requireAdmin(event.context.user);

  const id = getRouterParam(event, "id");
  if (!id || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid lead ID" });
  }

  const body = await readBody<{ updatedAt?: unknown; confirmed?: unknown }>(event);
  const version = typeof body?.updatedAt === "string" ? Date.parse(body.updatedAt) : NaN;
  if (!Number.isFinite(version)) {
    throw createError({ statusCode: 400, statusMessage: "A lead version is required" });
  }

  const lead = await prisma.leadDelivery.findUnique({
    where: { id },
    select: { lastErrorCode: true },
  });
  if (!lead) throw createError({ statusCode: 404, statusMessage: "Lead not found" });

  if (needsLeadDeliveryConfirmation(lead.lastErrorCode) && body?.confirmed !== true) {
    throw createError({ statusCode: 409, statusMessage: "Review Telegram before retrying this lead" });
  }

  const updated = await prisma.leadDelivery.updateMany({
    where: {
      id, status: "FAILED", lockedUntil: null, sentAt: null, telegramMessageId: null,
      updatedAt: { gte: new Date(version), lt: new Date(version + 1) },
      lastErrorCode: lead.lastErrorCode,
    },
    data: { status: "PENDING", attemptCount: 0, nextAttemptAt: new Date() },
  });

  if (!updated.count) {
    throw createError({ statusCode: 409, statusMessage: "Lead changed or cannot be retried" });
  }

  return { status: "PENDING" };
});
