/**
 * Конфигурация собственной аналитики для клиента.
 *
 * Это единственный источник действующего разрешения на трекинг. Клиент
 * спрашивает его в момент загрузки страницы и подключает трекер только
 * тогда, когда ответ однозначно разрешает сбор.
 *
 * Значение идентификатора не берётся из payload пререндеренных страниц:
 * там оно собрано при сборке и может быть устаревшим, поэтому пререндер
 * не должен включать трекер самостоятельно.
 *
 * Ответ не кэшируется. Иначе выключенная аналитика оставалась бы включённой
 * ещё пять минут из-за закэшированного публичного ответа.
 */
import { analyticsEnabled, ownAnalyticsSiteId } from "../../utils/analytics";

export default defineEventHandler((event) => {
  const enabled = analyticsEnabled();
  const siteId = enabled ? ownAnalyticsSiteId() : "";

  setResponseHeader(event, "Cache-Control", "no-store");

  return {
    enabled,
    siteId: siteId || null,
  };
});
