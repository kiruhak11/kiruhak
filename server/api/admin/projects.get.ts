import { prisma } from "../../utils/prisma";
import { requireAdmin } from "../../utils/require-admin";

export default defineEventHandler(async (event) => {
  requireAdmin(event.context.user);
  return prisma.project.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
});
