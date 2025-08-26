import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Project ID is required",
      });
    }

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw createError({
        statusCode: 404,
        statusMessage: "Project not found",
      });
    }

    return project;
  } catch (error) {
    console.error("Error fetching project:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch project",
    });
  }
});
