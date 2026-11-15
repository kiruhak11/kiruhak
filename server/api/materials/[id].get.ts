import { prisma } from "../../utils/prisma";
import { isValidMaterialId } from "../../utils/auth-route-policy";
import {
  fetchPublicMaterial,
  toMaterialPublicHttpError,
} from "../../utils/material-public";
import { resolveOptionalUserId } from "../../utils/optional-user";

export default defineEventHandler(async (event) => {
  setHeader(event, "cache-control", "no-store");

  const materialId = getRouterParam(event, "id");
  if (!isValidMaterialId(materialId)) {
    throw createError({
      statusCode: 404,
      statusMessage: "Material not found",
    });
  }

  const userId =
    event.context.user?.id ??
    (await resolveOptionalUserId(
      prisma,
      getHeader(event, "authorization"),
      useRuntimeConfig().authTokenSecret
    ));

  try {
    const material = await fetchPublicMaterial(prisma, materialId, { userId });

    return {
      success: true,
      material,
    };
  } catch (error) {
    const { statusCode, statusMessage } = toMaterialPublicHttpError(
      error,
      "Ошибка получения материала"
    );
    if (statusCode >= 500) {
      console.error("Ошибка получения материала:", error);
    }
    throw createError({ statusCode, statusMessage });
  }
});
