import { isLeadStatus } from "../../../../types/admin-lead";
import { prisma } from "../../../utils/prisma";
import { requireAdmin } from "../../../utils/require-admin";

const PAGE_SIZE = 20;

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "private, no-store");
  requireAdmin(event.context.user);

  const query = getQuery(event);
  const page = query.page === undefined ? 1 : Number(query.page);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100_000 ||
    (query.status !== undefined && !isLeadStatus(query.status))) {
    throw createError({ statusCode: 400, statusMessage: "Invalid lead filters" });
  }

  const where = { status: isLeadStatus(query.status) ? query.status : undefined };
  const [total, leads] = await prisma.$transaction([
    prisma.leadDelivery.count({ where }),
    prisma.leadDelivery.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        contact: true,
        email: true,
        business: true,
        task: true,
        budget: true,
        status: true,
        attemptCount: true,
        nextAttemptAt: true,
        lockedUntil: true,
        sentAt: true,
        telegramMessageId: true,
        lastErrorCode: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ], { isolationLevel: "RepeatableRead" });

  return {
    total,
    pageSize: PAGE_SIZE,
    leads: leads.map(lead => ({
      ...lead,
      telegramMessageId: lead.telegramMessageId?.toString() ?? null,
    })),
  };
});
