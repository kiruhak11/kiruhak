import { prisma } from "../../utils/prisma";
import { parseProjectInput } from "../../utils/project-input";
import { requireAdmin } from "../../utils/require-admin";

export default defineEventHandler(async (event) => {
  requireAdmin(event.context.user);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Project ID is required" });
  const data = parseProjectInput(await readBody(event), true);
  return prisma.project.update({ where: { id }, data: data as Parameters<typeof prisma.project.update>[0]["data"] });
});
