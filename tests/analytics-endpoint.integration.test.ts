import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

import { prisma } from "../server/utils/prisma";
import { recordAnalyticsPageView } from "../server/utils/analytics";

/**
 * Интеграционная проверка записи посещений.
 *
 * Требует изолированную PostgreSQL с синтетическими данными:
 *   TEST_DATABASE_URL=postgres://... npm run test:analytics-endpoint
 *
 * Без переменной окружения тест пропускается, а не падает. Реальные
 * посещения в production не создаются.
 */
const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const skip = databaseUrl ? false : "requires TEST_DATABASE_URL";

type SyntheticSite = {
  userId: string;
  siteId: string;
};

const createSyntheticSite = async (): Promise<SyntheticSite> => {
  const suffix = randomUUID().slice(0, 8);
  const login = `qa-analytics-${suffix}`;

  const user = await prisma.user.create({
    data: {
      telegramId: `qa-analytics-${suffix}`,
      login,
      password: "not-a-real-hash",
      firstName: "QA",
      balance: 0,
    },
  });

  const site = await prisma.site.create({
    data: {
      name: "QA Analytics",
      domain: `qa-analytics-${suffix}.test`,
      userId: user.id,
      isActive: true,
    },
  });

  return { userId: user.id, siteId: site.id };
};

const removeSyntheticSite = async (site: SyntheticSite) => {
  await prisma.site.deleteMany({ where: { id: site.siteId } });
  await prisma.user.deleteMany({ where: { id: site.userId } });
};

test("только просмотр страницы создаёт запись Visit", { skip }, async () => {
  const site = await createSyntheticSite();

  try {
    const before = await prisma.visit.count();

    const recorded = await recordAnalyticsPageView({
      siteId: site.siteId,
      page: "/qa-check?token=super-secret",
      referrer: "https://kiruhak11.ru/login?next=/admin",
      userAgent: "qa-agent",
      ip: "203.0.113.9",
    });

    assert.equal(recorded.success, true);
    assert.equal(await prisma.visit.count(), before + 1);

    const visit = await prisma.visit.findUnique({
      where: { id: recorded.success ? recorded.visitId : "" },
    });
    assert.ok(visit);
    assert.equal(visit.page, "/qa-check", "query-параметры не сохраняются");
    assert.equal(
      visit.referrer,
      "https://kiruhak11.ru/login",
      "query-параметры referrer не сохраняются"
    );
    assert.equal(visit.userAgent, "qa-agent");
    assert.equal(visit.sessionId, null, "постоянные идентификаторы не создаются");
  } finally {
    await removeSyntheticSite(site);
  }
});

test("клик и другие типы событий не создают посещение", { skip }, async () => {
  const site = await createSyntheticSite();

  try {
    const before = await prisma.visit.count();

    for (const event of ["click", "time_on_page", "page_refresh"]) {
      const result = await recordAnalyticsPageView({
        siteId: site.siteId,
        page: "/qa-check",
        ip: "203.0.113.9",
        event,
      });
      assert.equal(result.success, false, `событие ${event} не должно записываться`);
      if (!result.success) {
        assert.equal(result.error, "Unsupported event type");
      }
    }

    assert.equal(await prisma.visit.count(), before, "записей Visit не появилось");
  } finally {
    await removeSyntheticSite(site);
  }
});

test("неизвестный и неактивный сайт не создают посещение", { skip }, async () => {
  const site = await createSyntheticSite();

  try {
    const before = await prisma.visit.count();

    const unknown = await recordAnalyticsPageView({
      siteId: "site-that-does-not-exist",
      page: "/qa-check",
      ip: "203.0.113.9",
    });
    assert.equal(unknown.success, false);
    if (!unknown.success) {
      assert.equal(unknown.error, "Site not found");
    }

    await prisma.site.update({
      where: { id: site.siteId },
      data: { isActive: false },
    });

    const inactive = await recordAnalyticsPageView({
      siteId: site.siteId,
      page: "/qa-check",
      ip: "203.0.113.9",
    });
    assert.equal(inactive.success, false);

    assert.equal(await prisma.visit.count(), before, "записей Visit не появилось");
  } finally {
    await removeSyntheticSite(site);
  }
});
