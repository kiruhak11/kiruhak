import type { ProjectOwnershipType } from "~/types/project-case-study";

type ProjectCaseViewSource = {
  id?: string;
  title?: string;
  image?: string;
  description: string;
  shortDescription?: string | null;
  caseStudy?: {
    ownershipType?: ProjectOwnershipType | null;
    projectSummary?: string | null;
    role?: string | null;
    company?: string | null;
    responsibilities?: readonly string[];
    technicalHighlights?: readonly string[];
    technologies?: readonly string[];
  } | null;
};

/**
 * Public presentation for the current legacy Project record.
 * Numeric/result claims stay out of the public case until they have evidence.
 */
export function getProjectCaseView<T extends ProjectCaseViewSource>(project: T) {
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
