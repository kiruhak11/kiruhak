type FormValue = string | string[];

type BriefBody = {
  form?: Record<string, FormValue>;
};

const FIELD_LABELS: Record<string, string> = {
  companyName: "Как называется компания?",
  businessSphere: "В какой сфере работаете?",
  businessModel: "Это B2B или B2C?",
  regions: "Регионы/страны",
  currentSite: "Текущий сайт",
  redesignReason: "Почему новый сайт/редизайн?",
  mainProblems: "Какие проблемы нужно решить?",

  mainGoal: "Главная цель сайта",
  kpi: "KPI",
  targetAction: "Действие пользователя на сайте",

  targetClient: "Основной клиент",
  audienceAgeGenderIncome: "Возраст/пол/доход",
  b2bDecisionMaker: "B2B: кто принимает решение",
  clientPain: "Боли клиента",
  whyChooseYou: "Почему выбирают вас",
  currentAcquisition: "Как клиент сейчас находит вас",

  productsServices: "Товары/услуги",
  positionsCount: "Количество позиций",
  needCatalog: "Нужен каталог",
  needFilters: "Нужна фильтрация",
  needProductCards: "Нужны карточки товара",
  publicPrices: "Цены публичные",
  needOnlinePayment: "Нужна онлайн-оплата",

  competitors: "Конкуренты",
  competitorLikes: "Что нравится у конкурентов",
  competitorDislikes: "Что не нравится у конкурентов",
  visualReferences: "Визуальные референсы",

  requiredSections: "Какие разделы нужны",
  needAccount: "Нужен личный кабинет",
  needMultiLanguage: "Нужна мультиязычность",
  needMobileAdaptation: "Нужна мобильная адаптация",

  hasBrandStyle: "Есть фирменный стиль",
  hasLogo: "Есть логотип",
  hasBrandbook: "Есть брендбук",
  preferredColors: "Предпочтительные цвета",
  forbiddenColors: "Запрещённые цвета",
  visualStyle: "Предпочитаемый стиль",
  likedDesignSites: "Любимые сайты по дизайну",

  hasTexts: "Есть готовые тексты",
  needCopywriting: "Нужен копирайтинг",
  hasPhotos: "Есть проф. фото",
  needPhotoSession: "Нужна фотосъёмка",
  needVideo: "Нужны видео",
  whoWillFillContent: "Кто наполняет сайт",

  needFeedbackForms: "Нужны формы обратной связи",
  needChat: "Нужен чат",
  needCrm: "Нужна интеграция с CRM",
  crmName: "Какая CRM",
  needOneC: "Нужна интеграция с 1С",
  needPaymentSystems: "Нужна интеграция с платежами",
  paymentSystems: "Какие платежные системы",
  needCalculator: "Нужен калькулятор",
  needBlog: "Нужен блог",
  needReviews: "Нужны отзывы",
  needMap: "Нужна карта",

  hasDomain: "Есть домен",
  hasHosting: "Есть хостинг",
  needCms: "Нужна CMS",
  cmsPreference: "Какая CMS",
  needAdminPanel: "Нужна админ-панель",
  whoMaintains: "Кто поддерживает сайт",
  needSeo: "Нужна SEO-оптимизация",
  needAnalytics: "Нужна аналитика",

  planningContextAds: "Планируется контекстная реклама",
  planningSeoPromotion: "Планируется SEO-продвижение",
  planningTargetAds: "Планируется таргет",
  needLandingPages: "Нужны лендинги",
  hasUtp: "Есть УТП",

  launchDate: "Когда запуск",
  hasDeadline: "Есть дедлайн",
  deadlineDate: "Дата дедлайна",
  budget: "Бюджет",
  phasedDevelopment: "Поэтапная разработка",

  needPrivacyPolicy: "Нужна политика конфиденциальности",
  needOffer: "Нужна оферта",
  personalDataProcessing: "Будет обработка персональных данных",
  needCookieNotice: "Нужны cookie-уведомления",

  needTechSupport: "Нужна техподдержка после запуска",
  needFutureImprovements: "Нужны доработки в будущем",
  needSupportContract: "Нужен договор на обслуживание",

  mainDifference: "Главное отличие от конкурентов",
  whyPickYouStrategy: "Почему клиент должен выбрать вас",
  desiredBrandImage: "Какой образ бренда хотите",
  mandatoryHomepageBlocks: "Что обязательно на главной",
  successInSixMonths: "Что будет успехом через 6 месяцев",
};

const chunkText = (text: string, maxLength = 3900): string[] => {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const slice = text.slice(start, start + maxLength);
    const splitIndex = slice.lastIndexOf("\n");

    if (splitIndex > 0 && start + maxLength < text.length) {
      chunks.push(slice.slice(0, splitIndex));
      start += splitIndex + 1;
      continue;
    }

    chunks.push(slice);
    start += maxLength;
  }

  return chunks;
};

const formatValue = (value: FormValue | undefined): string => {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "Не указано";
  }

  const normalized = String(value || "").trim();
  return normalized || "Не указано";
};

const renderBriefText = (form: Record<string, FormValue>, userLabel: string): string => {
  const lines: string[] = [
    "📝 Новый бриф на разработку сайта",
    "",
    `👤 Пользователь: ${userLabel}`,
    `🕒 Время: ${new Date().toLocaleString("ru-RU")}`,
    "",
  ];

  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    lines.push(`• ${label}: ${formatValue(form[key])}`);
  }

  return lines.join("\n");
};

const sendToTelegram = async (message: string, token: string, chatId: string) => {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to send Telegram message: ${details}`,
    });
  }
};

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = (await readBody(event)) as BriefBody;
  const telegramToken =
    String(config.telegramToken || process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN || "").trim();
  const telegramChatId =
    String(config.telegramChatId || process.env.ADMIN_TELEGRAM_ID || process.env.TELEGRAM_CHAT_ID || "").trim();

  if (!body?.form || typeof body.form !== "object") {
    throw createError({
      statusCode: 400,
      statusMessage: "Brief form data is required",
    });
  }

  const form = body.form;

  if (!form.companyName || !String(form.companyName).trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Company name is required",
    });
  }

  if (!form.businessSphere || !String(form.businessSphere).trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Business sphere is required",
    });
  }

  if (!telegramToken || !telegramChatId) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "Telegram integration is not configured (set TELEGRAM_BOT_TOKEN/ADMIN_TELEGRAM_ID or TELEGRAM_TOKEN/TELEGRAM_CHAT_ID)",
    });
  }

  const authUser = event.context.user;
  const userLabel = authUser
    ? `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim() ||
      authUser.username ||
      authUser.telegramId ||
      authUser.id
    : "Неизвестный пользователь";

  const message = renderBriefText(form, userLabel);
  const chunks = chunkText(message);

  try {
    for (const chunk of chunks) {
      await sendToTelegram(chunk, telegramToken, telegramChatId);
    }
  } catch (error) {
    console.error("Brief telegram send error:", error);
    if (error && typeof error === "object" && "statusMessage" in error) {
      throw error;
    }
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to deliver brief to Telegram",
    });
  }

  return {
    success: true,
    message: "Brief sent successfully",
    chunks: chunks.length,
  };
});
