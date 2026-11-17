import type { PrismaClient } from "@prisma/client";
import { sanitizeHtml } from "../../util/sanitize-html";

/**
 * Разрешённые (allowlist) поля материала для публичного API.
 * userId, ratings и downloads намеренно отсутствуют.
 */
type MaterialPublicRow = {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  pages: number;
  features: string[];
  content: string;
  isActive: boolean;
  order: number;
};

export type MaterialPublicStats = {
  avgRating: number;
  ratingCount: number;
  downloadCount: number;
  userRating: number;
};

export type PublicMaterial = MaterialPublicRow & MaterialPublicStats;

export type MaterialPublicOptions = {
  userId?: string | null;
};

export const MATERIAL_PUBLIC_SELECT = {
  id: true,
  title: true,
  description: true,
  type: true,
  category: true,
  pages: true,
  features: true,
  content: true,
  isActive: true,
  order: true,
} as const;

const EMPTY_MATERIAL_STATS: MaterialPublicStats = {
  avgRating: 0,
  ratingCount: 0,
  downloadCount: 0,
  userRating: 0,
};

class MaterialPublicError extends Error {
  statusCode: number;
  statusMessage: string;

  constructor(statusCode: number, statusMessage: string) {
    super(statusMessage);
    this.statusCode = statusCode;
    this.statusMessage = statusMessage;
    this.name = "MaterialPublicError";
  }
}

function roundRating(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Преобразует любую ошибку в HTTP-статус и сообщение для публичного ответа. */
export function toMaterialPublicHttpError(
  error: unknown,
  fallbackStatusMessage: string
): { statusCode: number; statusMessage: string } {
  if (error instanceof MaterialPublicError) {
    return { statusCode: error.statusCode, statusMessage: error.statusMessage };
  }
  return { statusCode: 500, statusMessage: fallbackStatusMessage };
}

function toPublicMaterial(
  row: MaterialPublicRow,
  stats: MaterialPublicStats = EMPTY_MATERIAL_STATS
): PublicMaterial {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    category: row.category,
    pages: row.pages,
    features: row.features,
    content: sanitizeHtml(row.content),
    isActive: row.isActive,
    order: row.order,
    avgRating: stats.avgRating,
    ratingCount: stats.ratingCount,
    downloadCount: stats.downloadCount,
    userRating: stats.userRating,
  };
}

/**
 * Агрегированная статистика по материалам: средний рейтинг, количество
 * оценок и загрузок, а также оценка текущего пользователя (если он есть).
 * Сырые строки ratings/downloads наружу не отдаются.
 */
async function loadMaterialStats(
  prisma: PrismaClient,
  materialIds: string[],
  userId: string | null
): Promise<Map<string, MaterialPublicStats>> {
  const ids = [...new Set(materialIds)];
  const stats = new Map<string, MaterialPublicStats>();
  if (ids.length === 0) return stats;

  const [ratingGroups, downloadGroups, userRatings] = await Promise.all([
    prisma.materialRating.groupBy({
      by: ["materialId"],
      where: { materialId: { in: ids } },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.materialDownload.groupBy({
      by: ["materialId"],
      where: { materialId: { in: ids } },
      _count: { _all: true },
    }),
    userId
      ? prisma.materialRating.findMany({
          where: { userId, materialId: { in: ids } },
          select: { materialId: true, rating: true },
        })
      : Promise.resolve<{ materialId: string; rating: number }[]>([]),
  ]);

  const ratingByMaterial = new Map(
    ratingGroups.map((group) => [group.materialId, group] as const)
  );
  const downloadCountByMaterial = new Map(
    downloadGroups.map((group) => [group.materialId, group._count._all] as const)
  );
  const userRatingByMaterial = new Map(
    userRatings.map((rating) => [rating.materialId, rating.rating] as const)
  );

  for (const id of ids) {
    const group = ratingByMaterial.get(id);
    const ratingCount = group?._count._all ?? 0;
    const average = group?._avg.rating ?? 0;
    stats.set(id, {
      avgRating: ratingCount > 0 ? roundRating(average) : 0,
      ratingCount,
      downloadCount: downloadCountByMaterial.get(id) ?? 0,
      userRating: userRatingByMaterial.get(id) ?? 0,
    });
  }

  return stats;
}

/** Публичный список активных материалов с агрегированной статистикой. */
export async function fetchPublicMaterials(
  prisma: PrismaClient,
  options: MaterialPublicOptions = {}
): Promise<PublicMaterial[]> {
  const materials: MaterialPublicRow[] = await prisma.material.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: MATERIAL_PUBLIC_SELECT,
  });

  const stats = await loadMaterialStats(
    prisma,
    materials.map((material) => material.id),
    options.userId ?? null
  );

  return materials.map((material) =>
    toPublicMaterial(material, stats.get(material.id) ?? EMPTY_MATERIAL_STATS)
  );
}

/** Публичная карточка материала; бросает 404, если материал не найден. */
export async function fetchPublicMaterial(
  prisma: PrismaClient,
  materialId: string,
  options: MaterialPublicOptions = {}
): Promise<PublicMaterial> {
  const material: MaterialPublicRow | null = await prisma.material.findFirst({
    where: { id: materialId, isActive: true },
    select: MATERIAL_PUBLIC_SELECT,
  });

  if (!material) {
    throw new MaterialPublicError(404, "Material not found");
  }

  const stats = await loadMaterialStats(
    prisma,
    [material.id],
    options.userId ?? null
  );

  return toPublicMaterial(
    material,
    stats.get(material.id) ?? EMPTY_MATERIAL_STATS
  );
}
