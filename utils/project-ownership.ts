import type { ProjectOwnershipType } from "~/types/project-case-study";

export type PortfolioOwnership = Exclude<ProjectOwnershipType, "UNVERIFIED">;

export const portfolioOwnershipQuery = {
  OWN: "own",
  CLIENT: "client",
  PARTICIPATION: "participation",
} as const satisfies Record<PortfolioOwnership, string>;

export const portfolioOwnershipOrder: readonly PortfolioOwnership[] = ["OWN", "CLIENT", "PARTICIPATION"];

export function getPortfolioOwnershipFromQuery(query: unknown) {
  return portfolioOwnershipOrder.find((type) => portfolioOwnershipQuery[type] === query);
}

type OwnershipRecord = {
  id?: string;
  caseStudy?: { ownershipType?: ProjectOwnershipType | null } | null;
};

export function getProjectOwnershipType(project: OwnershipRecord): ProjectOwnershipType {
  return project.caseStudy?.ownershipType ?? "UNVERIFIED";
}

export function groupProjectsByOwnership<T extends OwnershipRecord>(projects: readonly T[]) {
  return {
    OWN: projects.filter((project) => getProjectOwnershipType(project) === "OWN"),
    CLIENT: projects.filter((project) => getProjectOwnershipType(project) === "CLIENT"),
    PARTICIPATION: projects.filter((project) => getProjectOwnershipType(project) === "PARTICIPATION"),
    UNVERIFIED: projects.filter((project) => getProjectOwnershipType(project) === "UNVERIFIED"),
  };
}
