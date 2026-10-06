import type { ProjectOwnershipType } from "~/types/project-case-study";

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
    PARTICIPATION: projects.filter((project) => getProjectOwnershipType(project) === "PARTICIPATION"),
    UNVERIFIED: projects.filter((project) => getProjectOwnershipType(project) === "UNVERIFIED"),
  };
}
