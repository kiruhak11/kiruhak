import { getProjectCaseStudy } from "../../constants/project-case-studies";

/** Convert legacy DB rows into an evidence-reviewed public project shape. */
export function toPublicProject<T extends { id: string }>(project: T) {
  const caseStudy = getProjectCaseStudy(String(project.id));
  const optimizedImages: Record<string, string> = {
    cmm7zid0n0004o301rk66jffv: "/images/projects/k-studio.webp",
    cmewb3qvv0003o11ge17zb005: "/images/projects/kes.webp",
    cmm7z9yya0003o3013vri6scs: "/images/projects/okna.webp",
    cmmth95p90000qp017bjtfbkt: "/images/projects/malina.webp",
  };
  const image = optimizedImages[project.id];

  if (!caseStudy) {
    return {
      ...project,
      ...(image ? { image } : {}),
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
    ...(image ? { image } : {}),
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
