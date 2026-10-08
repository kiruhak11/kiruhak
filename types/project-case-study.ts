export const projectOwnershipTypes = [
  "OWN",
  "CLIENT",
  "PARTICIPATION",
  "UNVERIFIED",
] as const;

export type ProjectOwnershipType = (typeof projectOwnershipTypes)[number];

export interface PublicProjectCaseStudy {
  ownershipType: ProjectOwnershipType;
  projectSummary: string;
  role?: string;
  company?: string;
  responsibilities: string[];
  technicalHighlights: string[];
  technologies: string[];
  productionUrl?: string | null;
  repositoryUrl?: string | null;
}

export type AdminProjectCaseStudy = PublicProjectCaseStudy;

export interface ProjectFormInput {
  title: string;
  shortDescription: string;
  description: string;
  image: string;
  category: string;
  ownershipType: ProjectOwnershipType;
  projectSummary: string;
  role: string;
  company: string;
  responsibilities: string[];
  technicalHighlights: string[];
  technologies: string[];
  liveUrl: string;
  githubUrl: string;
  featured: boolean;
  order: number;
}
