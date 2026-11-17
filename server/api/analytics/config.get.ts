/**
 * Конфигурация собственной аналитики для клиента.
 *
 * Идентификатор сайта нужен клиенту на пререндеренных страницах: их payload
 * собран на этапе сборки и не содержит значение, переданное окружением при
 * запуске. Endpoint отдаёт актуальное значение и не раскрывает ничего, кроме
 * публичного идентификатора сайта (он и так находится в коде установки
 * трекера на клиентских сайтах).
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig();
  const siteId = String(config.public.analyticsSiteId || "").trim();

  setResponseHeader(event, "Cache-Control", "public, max-age=300");

  return {
    siteId: siteId || null,
  };
});
