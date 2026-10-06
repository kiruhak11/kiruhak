type FeaturedProjectCandidate = {
  featured: boolean;
  caseStudy?: {
    ownershipType?: string | null;
    productionUrl?: string | null;
  } | null;
};

/** Keep homepage case studies within the curated, evidence-reviewed source of truth. */
export function getFeaturedPortfolioProjects<T extends FeaturedProjectCandidate>(projects: readonly T[]) {
  return projects.filter((project) => {
    const caseStudy = project.caseStudy;
    return project.featured && Boolean(caseStudy) &&
      (caseStudy?.ownershipType === "OWN" || caseStudy?.ownershipType === "PARTICIPATION") &&
      Boolean(caseStudy?.productionUrl);
  });
}
