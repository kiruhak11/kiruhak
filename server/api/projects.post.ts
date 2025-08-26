import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized - Authentication required",
      });
    }

    // Проверяем права администратора
    if (!user.isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden - Admin access required",
      });
    }

    const body = await readBody(event);

    console.log(`🔐 [POST /api/projects] Создание проекта пользователем:`, user.firstName);

    const project = await prisma.project.create({
      data: {
        title: body.title,
        description: body.description,
        shortDescription: body.shortDescription,
        image: body.image,
        technologies: body.technologies || [],
        category: body.category,
        client: body.client,
        duration: body.duration,
        budget: body.budget,
        features: body.features || [],
        challenges: body.challenges,
        solutions: body.solutions,
        results: body.results,
        liveUrl: body.liveUrl,
        githubUrl: body.githubUrl,
        featured: body.featured || false,
        order: body.order || 0,
      },
    });

    console.log(`🔐 [POST /api/projects] Проект успешно создан с ID:`, project.id);
    return project;
  } catch (error) {
    console.error("Error creating project:", error);
    
    // Если это ошибка аутентификации, возвращаем её как есть
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create project",
    });
  }
});
