import { prisma } from "../../../utils/prisma";
import puppeteer from "puppeteer";
import { sanitizeHtml } from "../../../../util/sanitize-html";

export default defineEventHandler(async (event) => {
  try {
    console.log("🔐 PDF: Начинаем генерацию PDF");

    const materialId = getRouterParam(event, "id");
    console.log("🔐 PDF: materialId", materialId);

    // Получаем пользователя из контекста (устанавливается middleware)
    const user = event.context.user;
    console.log("🔐 PDF: user", user ? "present" : "missing");

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    const userId = user.id;
    console.log("🔐 PDF: userId", userId);

    // Получаем материал из базы данных
    console.log("🔐 PDF: Получаем материал из БД");
    const material = await prisma.material.findUnique({
      where: {
        id: materialId,
        isActive: true,
      },
    });

    console.log("🔐 PDF: material", material ? "found" : "not found");

    if (!material) {
      throw createError({
        statusCode: 404,
        statusMessage: "Material not found",
      });
    }

    // Записываем загрузку в базу данных
    console.log("🔐 PDF: Записываем загрузку в БД");
    await prisma.materialDownload.create({
      data: {
        materialId,
        userId,
      },
    });
    console.log("🔐 PDF: Загрузка записана в БД");

    // Создаем HTML для PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${material.title}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            h1 {
              color: #2c3e50;
              border-bottom: 3px solid #3498db;
              padding-bottom: 10px;
              margin-bottom: 30px;
            }
            .material-info {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .material-type {
              display: inline-block;
              background: #3498db;
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              margin-right: 10px;
            }
            .material-category {
              display: inline-block;
              background: #e74c3c;
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #7f8c8d;
              font-size: 12px;
              border-top: 1px solid #ecf0f1;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <h1>${material.title}</h1>
          
          <div class="material-info">
            <div class="material-type">${getTypeText(material.type)}</div>
            <div class="material-category">${material.category}</div>
            <p><strong>Страниц:</strong> ${material.pages}</p>
            <p><strong>Описание:</strong> ${material.description}</p>
          </div>
          
          <div class="content">
            ${sanitizeHtml(material.content)}
          </div>
          
          <div class="footer">
            <p>Скачано с K-Studio</p>
            <p>Дата: ${new Date().toLocaleDateString("ru-RU")}</p>
          </div>
        </body>
      </html>
    `;

    // Генерируем PDF с помощью Puppeteer
    console.log("🔐 PDF: Запускаем Puppeteer");
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
    console.log("🔐 PDF: Puppeteer запущен");

    const page = await browser.newPage();
    console.log("🔐 PDF: Новая страница создана");

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    console.log("🔐 PDF: HTML контент установлен");

    console.log("🔐 PDF: Генерируем PDF");
    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
      printBackground: true,
    });
    console.log("🔐 PDF: PDF сгенерирован, размер:", pdfBuffer.length);

    await browser.close();
    console.log("🔐 PDF: Браузер закрыт");

    // Устанавливаем заголовки для скачивания
    setHeader(event, "Content-Type", "application/pdf");

    // Создаем безопасное имя файла
    const safeFileName = material.title
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .toLowerCase();

    setHeader(
      event,
      "Content-Disposition",
      `attachment; filename="${safeFileName}.pdf"`
    );
    setHeader(event, "Content-Length", pdfBuffer.length.toString());

    return pdfBuffer;
  } catch (error) {
    console.error("Ошибка генерации PDF:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Error generating PDF",
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
