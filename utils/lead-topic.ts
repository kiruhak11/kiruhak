/**
 * Логика применения темы обращения к описанию задачи.
 *
 * Тема подставляется в свободное поле «Что нужно сделать». Различать нужно
 * два случая:
 *
 * * поле содержит автоматически подставленную тему — её можно заменить
 *   при выборе другой темы;
 * * поле содержит текст, написанный посетителем, — его запрещено затирать.
 */

export type LeadTopicDecision =
  | { action: "apply"; text: string }
  | { action: "keep" };

/**
 * Что делать с полем описания задачи при выборе темы.
 *
 * @param currentTask текущее содержимое поля
 * @param autoTopic текст, подставленный автоматически (пустая строка — тема не применялась)
 * @param requestedTopic запрошенная тема
 */
export const resolveLeadTopic = (
  currentTask: string,
  autoTopic: string,
  requestedTopic: string
): LeadTopicDecision => {
  if (!requestedTopic.trim()) return { action: "keep" };

  const current = currentTask ?? "";
  const replaceable = current.trim() === "" || current === autoTopic;

  if (!replaceable) return { action: "keep" };

  return { action: "apply", text: requestedTopic };
};

/**
 * Отсоединилась ли тема от описания задачи.
 *
 * Истина, если посетитель убрал автоматически подставленный текст: тогда
 * выбранная кнопка темы противоречила бы содержимому поля.
 */
export const isLeadTopicDetached = (
  currentTask: string,
  autoTopic: string
): boolean => Boolean(autoTopic) && !(currentTask ?? "").startsWith(autoTopic);
