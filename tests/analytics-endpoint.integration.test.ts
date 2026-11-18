import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

import { PrismaClient } from "@prisma/client";

import { recordAnalyticsPageView } from "../server/utils/analytics";

/**
 * Интеграционная проверка записи посещений.
 *
 * Пишет только в изолированную PostgreSQL, переданную в
 * TEST_DATABASE_URL. К DATABASE_URL (production) тест не подключается для
 * записи никогда, а сам факт подключения проверяется на сервере: имя базы в
 * URL — это обещание, а `current_database()` — факт.
 *
 *   TEST_DATABASE_URL=postgres://... npm run test:analytics-endpoint
 *
 * Если задана только DATABASE_URL, тест не пропускается молча, а падает:
 * изоляция не доказана — ворота закрыты. Если не задано ни одной
 * переменной, тест пропускается (писать некуда и риска нет).
 */
const testUrl = (process.env.TEST_DATABASE_URL || "").trim();
const otherUrl = (process.env.DATABASE_URL || "").trim();

if (!testUrl && otherUrl) {
  throw new Error(
    "Запись посещений запрещена с одной лишь DATABASE_URL: укажите " +
      "TEST_DATABASE_URL — изолированную базу, отдельную от production."
  );
}

const skip = testUrl ? false : "requires TEST_DATABASE_URL";

type Target = {
  host: string;
  port: string;
  database: string;
};

/** Разбор URL подключения: кто, куда и в какую базу. */
const parseTarget = (url: string): Target => {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port || "5432",
    database: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
  };
};

const sameTarget = (left: Target, right: Target): boolean =>
  left.host === right.host &&
  left.port === right.port &&
  left.database === right.database;

/**
 * Подключение к тестовой базе с проверкой на сервере.
 *
 * Проверяется не имя переменной, а то, к какой базе клиент подключён
 * на самом деле: `current_database()` и адрес сервера приходят из
 * PostgreSQL, а не из строки подключения.
 */
const connectIsolated = async () => {
  const client = new PrismaClient({ datasources: { db: { url: testUrl } } });

  const rows = await client.$queryRaw<
    { db: string; usr: string; host: string | null; port: number | null }[]
  >`SELECT current_database() AS db, current_user AS usr,
           inet_server_addr()::text AS host, inet_server_port() AS port`;

  const actual = rows[0];
  assert.ok(actual, "сервер не ответил на проверку подключения");

  const declared = parseTarget(testUrl);
  assert.equal(
    actual.db,
    declared.database,
    `клиент подключён к базе ${actual.db}, а не к ${declared.database}`
  );

  if (otherUrl) {
    const other = parseTarget(otherUrl);
    assert.ok(
      !sameTarget(declared, other),
      "TEST_DATABASE_URL указывает на ту же базу, что и DATABASE_URL — " +
        "это не изоляция"
    );
    assert.notEqual(
      actual.db,
      other.database,
      "клиент подключён к базе из DATABASE_URL — запись в production недопустима"
    );
  }

  return { client, actual };
};

type SyntheticSite = {
  userId: string;
  siteId: string;
};

const createSyntheticSite = async (
  client: PrismaClient
): Promise<SyntheticSite> => {
  const suffix = randomUUID().slice(0, 8);
  const login = `qa-analytics-${suffix}`;

  const user = await client.user.create({
    data: {
      telegramId: `qa-analytics-${suffix}`,
      login,
      password: "not-a-real-hash",
      firstName: "QA",
      balance: 0,
    },
  });

  const site = await client.site.create({
    data: {
      name: "QA Analytics",
      domain: `qa-analytics-${suffix}.test`,
      userId: user.id,
      isActive: true,
    },
  });

  return { userId: user.id, siteId: site.id };
};

const removeSyntheticSite = async (
  client: PrismaClient,
  site: SyntheticSite
) => {
  await client.site.deleteMany({ where: { id: site.siteId } });
  await client.user.deleteMany({ where: { id: site.userId } });
};

test("изоляция тестовой базы доказана на сервере", { skip }, async () => {
  const { client } = await connectIsolated();
  try {
    // Подключение состоялось, база — та, что объявлена в TEST_DATABASE_URL.
    assert.ok(client);
  } finally {
    await client.$disconnect();
  }
});

test("только просмотр страницы создаёт запись Visit", { skip }, async () => {
  const { client } = await connectIsolated();
  const previousFlag = process.env.ANALYTICS_ENABLED;
  process.env.ANALYTICS_ENABLED = "true";

  try {
    const site = await createSyntheticSite(client);

    try {
      const before = await client.visit.count();

      const recorded = await recordAnalyticsPageView(
        {
          siteId: site.siteId,
          page: "/qa-check?token=super-secret",
          referrer: "https://kiruhak11.ru/login?next=/admin",
          userAgent: "qa-agent",
          ip: "203.0.113.9",
        },
        client
      );

      assert.equal(recorded.success, true);
      assert.equal(await client.visit.count(), before + 1);

      const visit = await client.visit.findUnique({
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
      await removeSyntheticSite(client, site);
    }
  } finally {
    if (previousFlag === undefined) delete process.env.ANALYTICS_ENABLED;
    else process.env.ANALYTICS_ENABLED = previousFlag;
    await client.$disconnect();
  }
});

test("выключенный сбор не создаёт запись для сайта приложения", { skip }, async () => {
  const { client } = await connectIsolated();
  const previousFlag = process.env.ANALYTICS_ENABLED;
  const previousSite = process.env.NUXT_PUBLIC_ANALYTICS_SITE_ID;

  try {
    const site = await createSyntheticSite(client);

    try {
      // Сбор выключен, и сайт приложения указан: запись не создаётся.
      process.env.ANALYTICS_ENABLED = "false";
      process.env.NUXT_PUBLIC_ANALYTICS_SITE_ID = site.siteId;

      const before = await client.visit.count();
      const refused = await recordAnalyticsPageView(
        {
          siteId: site.siteId,
          page: "/qa-check",
          ip: "203.0.113.9",
        },
        client
      );

      assert.equal(refused.success, false);
      assert.equal(
        await client.visit.count(),
        before,
        "при выключенном сборе записи Visit не появились"
      );
    } finally {
      await removeSyntheticSite(client, site);
    }
  } finally {
    if (previousFlag === undefined) delete process.env.ANALYTICS_ENABLED;
    else process.env.ANALYTICS_ENABLED = previousFlag;
    if (previousSite === undefined) delete process.env.NUXT_PUBLIC_ANALYTICS_SITE_ID;
    else process.env.NUXT_PUBLIC_ANALYTICS_SITE_ID = previousSite;
    await client.$disconnect();
  }
});

test("выключенный сбор не запрещает трекинг чужих сайтов", { skip }, async () => {
  const { client } = await connectIsolated();
  const previousFlag = process.env.ANALYTICS_ENABLED;
  const previousSite = process.env.NUXT_PUBLIC_ANALYTICS_SITE_ID;

  try {
    const site = await createSyntheticSite(client);

    try {
      // Флаг выключен для сайта приложения, но чужие сайты используют тот же
      // endpoint: глобальный запрет сломал бы их трекинг.
      process.env.ANALYTICS_ENABLED = "false";
      process.env.NUXT_PUBLIC_ANALYTICS_SITE_ID = "site-of-the-application";

      const before = await client.visit.count();
      const recorded = await recordAnalyticsPageView(
        {
          siteId: site.siteId,
          page: "/qa-check",
          ip: "203.0.113.9",
        },
        client
      );

      assert.equal(recorded.success, true);
      assert.equal(await client.visit.count(), before + 1);
    } finally {
      await removeSyntheticSite(client, site);
    }
  } finally {
    if (previousFlag === undefined) delete process.env.ANALYTICS_ENABLED;
    else process.env.ANALYTICS_ENABLED = previousFlag;
    if (previousSite === undefined) delete process.env.NUXT_PUBLIC_ANALYTICS_SITE_ID;
    else process.env.NUXT_PUBLIC_ANALYTICS_SITE_ID = previousSite;
    await client.$disconnect();
  }
});

test("клик и другие типы событий не создают посещение", { skip }, async () => {
  const { client } = await connectIsolated();
  const previousFlag = process.env.ANALYTICS_ENABLED;
  process.env.ANALYTICS_ENABLED = "true";

  try {
    const site = await createSyntheticSite(client);

    try {
      const before = await client.visit.count();

      for (const event of ["click", "time_on_page", "page_refresh"]) {
        const result = await recordAnalyticsPageView(
          {
            siteId: site.siteId,
            page: "/qa-check",
            ip: "203.0.113.9",
            event,
          },
          client
        );
        assert.equal(result.success, false, `событие ${event} не должно записываться`);
        if (!result.success) {
          assert.equal(result.error, "Unsupported event type");
        }
      }

      assert.equal(await client.visit.count(), before, "записей Visit не появилось");
    } finally {
      await removeSyntheticSite(client, site);
    }
  } finally {
    if (previousFlag === undefined) delete process.env.ANALYTICS_ENABLED;
    else process.env.ANALYTICS_ENABLED = previousFlag;
    await client.$disconnect();
  }
});

test("неизвестный и неактивный сайт не создают посещение", { skip }, async () => {
  const { client } = await connectIsolated();
  const previousFlag = process.env.ANALYTICS_ENABLED;
  process.env.ANALYTICS_ENABLED = "true";

  try {
    const site = await createSyntheticSite(client);

    try {
      const before = await client.visit.count();

      const unknown = await recordAnalyticsPageView(
        {
          siteId: "site-that-does-not-exist",
          page: "/qa-check",
          ip: "203.0.113.9",
        },
        client
      );
      assert.equal(unknown.success, false);
      if (!unknown.success) {
        assert.equal(unknown.error, "Site not found");
      }

      await client.site.update({
        where: { id: site.siteId },
        data: { isActive: false },
      });

      const inactive = await recordAnalyticsPageView(
        {
          siteId: site.siteId,
          page: "/qa-check",
          ip: "203.0.113.9",
        },
        client
      );
      assert.equal(inactive.success, false);

      assert.equal(await client.visit.count(), before, "записей Visit не появилось");
    } finally {
      await removeSyntheticSite(client, site);
    }
  } finally {
    if (previousFlag === undefined) delete process.env.ANALYTICS_ENABLED;
    else process.env.ANALYTICS_ENABLED = previousFlag;
    await client.$disconnect();
  }
});

test(
  "во вторую базу (DATABASE_URL) не пишется ничего",
  { skip: testUrl && otherUrl ? false : "requires a second database" },
  async () => {
    const { client } = await connectIsolated();
    const other = new PrismaClient({ datasources: { db: { url: otherUrl } } });
    const previousFlag = process.env.ANALYTICS_ENABLED;
    process.env.ANALYTICS_ENABLED = "true";

    try {
      const site = await createSyntheticSite(client);

      try {
        const beforeOther = await other.visit.count();

        const recorded = await recordAnalyticsPageView(
          {
            siteId: site.siteId,
            page: "/qa-check",
            ip: "203.0.113.9",
          },
          client
        );
        assert.equal(recorded.success, true);

        assert.equal(
          await other.visit.count(),
          beforeOther,
          "во второй базе не должно появиться ни одной записи"
        );
        const leaked = await other.visit.findFirst({
          where: { siteId: site.siteId },
        });
        assert.equal(leaked, null, "запись просочилась во вторую базу");
      } finally {
        await removeSyntheticSite(client, site);
      }
    } finally {
      if (previousFlag === undefined) delete process.env.ANALYTICS_ENABLED;
      else process.env.ANALYTICS_ENABLED = previousFlag;
      await other.$disconnect();
      await client.$disconnect();
    }
  }
);
