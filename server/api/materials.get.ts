import { prisma } from "../utils/prisma";
import {
  fetchPublicMaterials,
  toMaterialPublicHttpError,
} from "../utils/material-public";
import { resolveOptionalUserId } from "../utils/optional-user";

export default defineEventHandler(async (event) => {
  setHeader(event, "cache-control", "no-store");

  const userId =
    event.context.user?.id ??
    (await resolveOptionalUserId(
      prisma,
      getHeader(event, "authorization"),
      useRuntimeConfig().authTokenSecret
    ));

  try {
    const materials = await fetchPublicMaterials(prisma, { userId });

    return {
      success: true,
      materials,
    };
  } catch (error) {
    const { statusCode, statusMessage } = toMaterialPublicHttpError(
      error,
      "Ошибка получения материалов"
    );
    if (statusCode >= 500) {
      console.error("Ошибка получения материалов:", error);
    }
    throw createError({ statusCode, statusMessage });
  }
});
