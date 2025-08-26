import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

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

    return project;
  } catch (error) {
    console.error("Error creating project:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create project",
    });
  }
});
