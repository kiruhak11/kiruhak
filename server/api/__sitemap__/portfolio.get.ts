import { portfolioCasePath, portfolioPublications } from "../../../constants/portfolio-publications";
import { prisma } from "../../utils/prisma";
import { toPublicProject } from "../../utils/public-project";

export default defineEventHandler(async () => {
  const projects = await prisma.project.findMany({
    where: { id: { in: portfolioPublications.map(({ id }) => id) } },
    select: { id: true, ownershipType: true, updatedAt: true },
  });

  return projects.flatMap((project) => {
    const { caseSlug } = toPublicProject(project);
    return caseSlug ? [{ loc: portfolioCasePath(caseSlug), lastmod: project.updatedAt.toISOString() }] : [];
  });
});
