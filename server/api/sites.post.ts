import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const name = String(body?.name || "").trim();
    const domain = String(body?.domain || "").trim().toLowerCase();
    const description = body?.description ? String(body.description).trim() : "";

    // Получаем пользователя из контекста (добавлено middleware)
    const user = event.context.user;
    if (!user) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    // Валидация
    if (!name || !domain) {
      return {
        success: false,
        error: "name and domain are required",
      };
    }

    if (name.length > 100) {
      return {
        success: false,
        error: "name is too long",
      };
    }

    if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain)) {
      return {
        success: false,
        error: "Invalid domain format",
      };
    }

    // Списываем стоимость сайта атомарно.
    const siteCost = 10000;
    const site = await prisma.$transaction(async (tx) => {
      const existingSite = await tx.site.findUnique({
        where: { domain },
      });
      if (existingSite) {
        throw createError({
          statusCode: 409,
          statusMessage: "Site with this domain already exists",
        });
      }

      const updated = await tx.user.updateMany({
        where: {
          id: user.id,
          balance: { gte: siteCost },
        },
        data: {
          balance: { decrement: siteCost },
        },
      });

      if (updated.count === 0) {
        throw createError({
          statusCode: 402,
          statusMessage: "Insufficient balance",
        });
      }

      const createdSite = await tx.site.create({
        data: {
          name,
          domain,
          description: description ? description.slice(0, 500) : null,
          userId: user.id,
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "debit",
          amount: siteCost,
          description: `Создание сайта: ${name}`,
        },
      });

      return createdSite;
    });

    const freshUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { balance: true },
    });

    return {
      success: true,
      site: {
        id: site.id,
        name: site.name,
        domain: site.domain,
        description: site.description,
        trackingCode: generateTrackingCode(site.id),
      },
      newBalance: freshUser?.balance ?? 0,
    };
  } catch (error) {
    if ((error as { statusCode?: number })?.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create site",
    });
  }
});

function generateTrackingCode(siteId: string) {
  return `
<!-- Kiruhak Analytics -->
<script>
  window.KIRUHAK_SITE_ID = '${siteId}';
</script>
<script src="https://kiruhak11.ru/analytics.js"></script>
<!-- End Kiruhak Analytics -->
  `.trim();
}
