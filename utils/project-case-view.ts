import type { Project } from "~/composables/useProjects";

/**
 * Public presentation for the current legacy Project record.
 * Numeric/result claims stay out of the public case until they have evidence.
 */
export function getProjectCaseView(project: Project) {
  const isKesRepository = /github(?:\.ru|\.com)\/kiruhak11\/kes\/?$/i.test(
    project.githubUrl || ""
  );
  const technologies = (project.technologies || []).filter(Boolean);
  const caseTechnologies = isKesRepository
    ? [
        ...technologies.filter((technology) => !/supabase/i.test(technology)),
        "Prisma",
        "MySQL",
      ]
    : technologies;

  return {
    productSummary: project.shortDescription?.trim() || project.description.trim(),
    productDescription: project.description.trim(),
    task: project.challenges?.trim() || null,
    contribution: project.solutions?.trim() || null,
    features: (project.features || []).filter(Boolean),
    technologies: [...new Set(caseTechnologies)],
  };
}
