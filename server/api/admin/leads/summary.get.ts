import type { LeadCounts } from "../../../../types/admin-lead";
import { prisma } from "../../../utils/prisma";
import { requireAdmin } from "../../../utils/require-admin";

export default defineEventHandler(async (event): Promise<LeadCounts> => {
  setResponseHeader(event, "Cache-Control", "private, no-store");
  requireAdmin(event.context.user);

  const statuses = await prisma.leadDelivery.groupBy({
    by: ["status"],
    where: { status: { in: ["PENDING", "RETRY", "FAILED"] } },
    _count: { _all: true },
  });

  return {
    undelivered: statuses.reduce((total, row) => total + row._count._all, 0),
    failed: statuses.find(row => row.status === "FAILED")?._count._all ?? 0,
  };
});
