export const projectOwnershipTypes = [
  "OWN",
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
