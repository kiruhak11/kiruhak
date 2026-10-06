import type { Project } from "~/composables/useProjects";

/**
 * Public presentation for the current legacy Project record.
 * Numeric/result claims stay out of the public case until they have evidence.
 */
export function getProjectCaseView(project: Project) {
  const caseStudy = project.caseStudy;

  return {
    ownershipType: caseStudy?.ownershipType ?? "UNVERIFIED",
    productSummary:
      caseStudy?.projectSummary || project.shortDescription?.trim() || project.description.trim(),
    productDescription: caseStudy?.projectSummary || project.description.trim(),
    role: caseStudy?.role ?? null,
    company: caseStudy?.company ?? null,
    responsibilities: caseStudy?.responsibilities ?? [],
    technicalHighlights: caseStudy?.technicalHighlights ?? [],
    technologies: [...new Set(caseStudy?.technologies ?? [])],
  };
}
