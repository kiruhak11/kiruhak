/**
 * Публикация юридических документов.
 *
 * Документы считаются опубликованными только когда это явно разрешено
 * конфигурацией (`runtimeConfig.public.legalDocumentsPublic === true`).
 * В остальных случаях страницы доступны лишь для локального просмотра —
 * это защищает от случайного преждевременного публикования текстов.
 */
export default defineNuxtRouteMiddleware(() => {
  const config = useRuntimeConfig();
  const published = config.public.legalDocumentsPublic === true;
  if (published) return;

  const event = useRequestEvent();
  const hostHeader = event ? getRequestHeader(event, "host") : undefined;
  const host = hostHeader
    ?.replace(/^\[([^\]]+)\](?::\d+)?$/, "$1")
    .replace(/:\d+$/, "");
  const localReview =
    host === "localhost" || host === "127.0.0.1" || host === "::1";

  if (!localReview) {
    throw createError({
      statusCode: 404,
      statusMessage: "Legal documents are not published",
    });
  }
});
