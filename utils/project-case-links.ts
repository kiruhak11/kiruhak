import type { ProjectOwnershipType } from "~/types/project-case-study";
import { getProjectExternalLinks } from "~/utils/project-links";

/** Build external actions only from evidence-reviewed case metadata. */
export function getVerifiedProjectLinks(project: {
  caseStudy?: {
    ownershipType: ProjectOwnershipType;
    productionUrl?: string | null;
    repositoryUrl?: string | null;
  } | null;
}) {
  const caseStudy = project.caseStudy;
  if (!caseStudy || caseStudy.ownershipType === "UNVERIFIED") {
    return { liveUrl: null, githubUrl: null };
  }

  return getProjectExternalLinks({
    liveUrl: caseStudy.productionUrl,
    githubUrl: caseStudy.repositoryUrl,
  });
}
