import { getProjectCaseStudy } from "../../constants/project-case-studies";

/** Convert legacy DB rows into an evidence-reviewed public project shape. */
export function toPublicProject<T extends { id: string }>(project: T) {
  const caseStudy = getProjectCaseStudy(String(project.id));

  if (!caseStudy) {
    return {
      ...project,
      description: "Описание проекта уточняется.",
      shortDescription: "",
      client: null,
      duration: null,
      budget: null,
      features: [],
      challenges: null,
      solutions: null,
      results: null,
      technologies: [],
      liveUrl: null,
      githubUrl: null,
      featured: false,
      caseStudy: {
        ownershipType: "UNVERIFIED" as const,
        projectSummary: "Описание проекта уточняется.",
        responsibilities: [],
        technicalHighlights: [],
        technologies: [],
        productionUrl: null,
        repositoryUrl: null,
      },
    };
  }

  return {
    ...project,
    description: caseStudy.projectSummary,
    shortDescription: caseStudy.projectSummary,
    client: caseStudy.company ?? null,
    duration: null,
    budget: null,
    features: [],
    challenges: null,
    solutions: null,
    results: null,
    technologies: caseStudy.technologies,
    liveUrl: caseStudy.productionUrl ?? null,
    githubUrl: caseStudy.repositoryUrl ?? null,
    featured: caseStudy.ownershipType === "UNVERIFIED" ? false : project.featured,
    caseStudy,
  };
}
