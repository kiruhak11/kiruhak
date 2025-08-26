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

    await prisma.project.delete({
      where: { id },
    });

    return { success: true, message: "Project deleted successfully" };
  } catch (error) {
    console.error("Error deleting project:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete project",
    });
  }
});
