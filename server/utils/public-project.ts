import { getPortfolioPublication } from "../../constants/portfolio-publications";
import { getProjectCaseStudy } from "../../constants/project-case-studies";
import type { PublicProjectCaseStudy } from "../../types/project-case-study";

type PublicProjectOutput = {
  [key: string]: unknown;
  id: string;
  description: string;
  shortDescription: string;
  image: string;
  caseSlug: string | null;
  client: string | null;
  duration: null;
  budget: null;
  features: string[];
  challenges: null;
  solutions: null;
  results: null;
  technologies: string[];
  liveUrl: string | null;
  githubUrl: string | null;
  featured: boolean;
  caseStudy: PublicProjectCaseStudy;
};

/** Convert legacy DB rows into an evidence-reviewed public project shape. */
export function toPublicProject<T extends { id: string }>(project: T): PublicProjectOutput {
  const row = project as T & {
    ownershipType?: string; projectSummary?: string | null; role?: string | null;
    company?: string | null; responsibilities?: string[]; technicalHighlights?: string[];
    technologies?: string[]; liveUrl?: string | null; githubUrl?: string | null;
    featured?: boolean;
  };
  const {
    ownershipType: _ownershipType, projectSummary: _projectSummary, role: _role,
    company: _company, responsibilities: _responsibilities,
    technicalHighlights: _technicalHighlights, ...publicBase
  } = row;
  const storedType = row.ownershipType;
  const validType = storedType === "OWN" || storedType === "CLIENT" || storedType === "PARTICIPATION" || storedType === "UNVERIFIED";
  const registry = validType ? null : getProjectCaseStudy(String(project.id));
  const ownershipType = validType ? storedType : registry?.ownershipType ?? "UNVERIFIED";
  const summary = validType ? row.projectSummary : registry?.projectSummary;
  const isVerified = ownershipType !== "UNVERIFIED";
  const caseStudy = {
    ownershipType,
    projectSummary: isVerified ? summary || "Описание проекта уточняется." : "Описание проекта уточняется.",
    ...(isVerified && (validType ? row.role : registry?.role) ? { role: validType ? row.role : registry?.role } : {}),
    ...(isVerified && (validType ? row.company : registry?.company) ? { company: validType ? row.company : registry?.company } : {}),
    responsibilities: isVerified ? (validType ? row.responsibilities ?? [] : registry?.responsibilities ?? []) : [],
    technicalHighlights: isVerified ? (validType ? row.technicalHighlights ?? [] : registry?.technicalHighlights ?? []) : [],
    technologies: isVerified ? (validType ? row.technologies ?? [] : registry?.technologies ?? []) : [],
    productionUrl: isVerified ? (validType ? row.liveUrl ?? null : registry?.productionUrl ?? null) : null,
    repositoryUrl: isVerified ? (validType ? row.githubUrl ?? null : registry?.repositoryUrl ?? null) : null,
  };
  const publication = getPortfolioPublication(project.id, ownershipType);
  const image = publication?.cover.src ?? "";
  const caseSlug = publication?.slug ?? null;

  if (!isVerified) {
    return {
      ...publicBase,
      image,
      caseSlug,
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
        ...caseStudy,
      },
    } as PublicProjectOutput;
  }

  return {
    ...publicBase,
    image,
    caseSlug,
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
    featured: caseStudy.ownershipType === "UNVERIFIED" ? false : row.featured ?? false,
    caseStudy,
  } as PublicProjectOutput;
}
