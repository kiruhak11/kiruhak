import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
    });

    return projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch projects",
    });
  }
});
