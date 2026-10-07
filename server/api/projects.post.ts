import { prisma } from "../utils/prisma";
import { parseProjectInput } from "../utils/project-input";
import { requireAdmin } from "../utils/require-admin";

export default defineEventHandler(async (event) => {
  requireAdmin(event.context.user);
  const data = parseProjectInput(await readBody(event));
  return prisma.project.create({ data: data as Parameters<typeof prisma.project.create>[0]["data"] });
});
