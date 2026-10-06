import { prisma } from "../../../utils/prisma";
import { isValidMaterialId } from "../../../utils/auth-route-policy";

export default defineEventHandler(async (event) => {
  try {
    console.log("🔐 PDF Simple: Начинаем генерацию PDF");

    const materialId = getRouterParam(event, "id");
    console.log("🔐 PDF Simple: materialId", materialId);

    if (!isValidMaterialId(materialId)) {
      throw createError({ statusCode: 400, statusMessage: "Invalid material ID" });
    }

    // Получаем пользователя из контекста (устанавливается middleware)
    const user = event.context.user;
    console.log("🔐 PDF Simple: user", user ? "present" : "missing");

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    const userId = user.id;
    console.log("🔐 PDF Simple: userId", userId);

    // Получаем материал из базы данных
    console.log("🔐 PDF Simple: Получаем материал из БД");
    const material = await prisma.material.findUnique({
      where: {
        id: materialId,
        isActive: true,
      },
    });

    console.log("🔐 PDF Simple: material", material ? "found" : "not found");

    if (!material) {
      throw createError({
        statusCode: 404,
        statusMessage: "Material not found",
      });
    }

    // Записываем загрузку в базу данных
    console.log("🔐 PDF Simple: Записываем загрузку в БД");
    await prisma.materialDownload.create({
      data: {
        materialId,
        userId,
      },
    });
    console.log("🔐 PDF Simple: Загрузка записана в БД");

    // Создаем простой текстовый файл вместо PDF
    const content = `
${material.title}
${"=".repeat(material.title.length)}

Тип: ${getTypeText(material.type)}
Категория: ${material.category}
Страниц: ${material.pages}
Описание: ${material.description}

${material.content}

---
Скачано с K-Studio
Дата: ${new Date().toLocaleDateString("ru-RU")}
    `.trim();

    // Устанавливаем заголовки для скачивания
    setHeader(event, "Content-Type", "text/plain; charset=utf-8");

    // Создаем безопасное имя файла
    const safeFileName = material.title
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .toLowerCase();

    setHeader(
      event,
      "Content-Disposition",
      `attachment; filename="${safeFileName}.txt"`
    );

    return content;
  } catch (error) {
    console.error("Ошибка генерации файла:", error);
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Error generating file",
    });
  }
});

function getTypeText(type) {
  const texts = {
    checklist: "Чек-лист",
    template: "Шаблон",
    architecture: "Архитектура",
    guide: "Руководство",
  };
  return texts[type] || type;
}
