import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { name, domain, description } = body;

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

    // Проверяем баланс (100 рублей = 10000 копеек)
    const siteCost = 10000;
    if (user.balance < siteCost) {
      return {
        success: false,
        error: "Insufficient balance",
        required: siteCost,
        current: user.balance,
      };
    }

    // Проверяем, не существует ли уже сайт с таким доменом
    const existingSite = await prisma.site.findUnique({
      where: { domain },
    });

    if (existingSite) {
      return {
        success: false,
        error: "Site with this domain already exists",
      };
    }

    // Создаем новый сайт и списываем средства
    const [site] = await prisma.$transaction([
      prisma.site.create({
        data: {
          name,
          domain,
          description: description || null,
          userId: user.id,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { balance: user.balance - siteCost },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: "debit",
          amount: siteCost,
          description: `Создание сайта: ${name}`,
        },
      }),
    ]);

    return {
      success: true,
      site: {
        id: site.id,
        name: site.name,
        domain: site.domain,
        description: site.description,
        trackingCode: generateTrackingCode(site.id),
      },
      newBalance: user.balance - siteCost,
    };
  } catch (error) {
    console.error("Error creating site:", error);
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
