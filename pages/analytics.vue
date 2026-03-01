<template>
  <NuxtLayout>
    <div class="brief-page">
      <div class="container">
        <header class="page-header">
          <h1>Бриф на разработку сайта</h1>
          <p>
            Заполните анкету. Черновик сохраняется автоматически в браузере и
            вы можете продолжить позже.
          </p>
        </header>

        <div class="status-row">
          <span class="draft-status">{{ saveStatusText }}</span>
          <button class="clear-btn" type="button" @click="clearDraft" :disabled="sending">
            Очистить черновик
          </button>
        </div>

        <form class="brief-form" @submit.prevent="submitBrief">
          <section
            v-for="section in sections"
            :key="section.id"
            class="question-section"
          >
            <h2>{{ section.title }}</h2>
            <div class="questions-grid">
              <div
                v-for="question in section.questions"
                :key="question.key"
                class="form-group"
              >
                <label :for="question.key">
                  {{ question.label }}
                  <span v-if="question.required" class="required">*</span>
                </label>

                <template v-if="question.type === 'select'">
                  <select
                    :id="question.key"
                    v-model="form[question.key]"
                    :required="question.required"
                  >
                    <option value="">Выберите вариант</option>
                    <option
                      v-for="option in question.options"
                      :key="option"
                      :value="option"
                    >
                      {{ option }}
                    </option>
                  </select>
                </template>

                <template v-else-if="question.type === 'multiselect'">
                  <div class="checkbox-grid">
                    <label
                      v-for="option in question.options"
                      :key="`${question.key}-${option}`"
                      class="checkbox-item"
                    >
                      <input
                        type="checkbox"
                        :checked="(form[question.key] || []).includes(option)"
                        @change="toggleMulti(question.key, option)"
                      />
                      <span>{{ option }}</span>
                    </label>
                  </div>
                </template>

                <template v-else-if="question.type === 'textarea'">
                  <textarea
                    :id="question.key"
                    v-model="form[question.key]"
                    :required="question.required"
                    :rows="question.rows || 4"
                  />
                </template>

                <template v-else>
                  <input
                    :id="question.key"
                    v-model="form[question.key]"
                    :required="question.required"
                    type="text"
                  />
                </template>
              </div>
            </div>
          </section>

          <div class="actions">
            <button type="submit" class="submit-btn" :disabled="sending">
              {{ sending ? "Отправка..." : "Отправить бриф в Telegram" }}
            </button>
            <p v-if="submitMessage" :class="['submit-message', submitError ? 'error' : 'success']">
              {{ submitMessage }}
            </p>
          </div>
        </form>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
const router = useRouter();
const { isAuthenticated, initAuth, refreshUser } = useAuth();
const { apiFetch } = useApi();

const DRAFT_KEY = "website_brief_draft_v1";

interface QuestionConfig {
  key: keyof BriefForm;
  label: string;
  type: "text" | "textarea" | "select" | "multiselect";
  options?: string[];
  required?: boolean;
  rows?: number;
}

interface SectionConfig {
  id: string;
  title: string;
  questions: QuestionConfig[];
}

type BriefForm = {
  companyName: string;
  businessSphere: string;
  businessModel: string;
  regions: string;
  currentSite: string;
  redesignReason: string;
  mainProblems: string;

  mainGoal: string[];
  kpi: string;
  targetAction: string;

  targetClient: string;
  audienceAgeGenderIncome: string;
  b2bDecisionMaker: string;
  clientPain: string;
  whyChooseYou: string;
  currentAcquisition: string;

  productsServices: string;
  positionsCount: string;
  needCatalog: string;
  needFilters: string;
  needProductCards: string;
  publicPrices: string;
  needOnlinePayment: string;

  competitors: string;
  competitorLikes: string;
  competitorDislikes: string;
  visualReferences: string;

  requiredSections: string;
  needAccount: string;
  needMultiLanguage: string;
  needMobileAdaptation: string;

  hasBrandStyle: string;
  hasLogo: string;
  hasBrandbook: string;
  preferredColors: string;
  forbiddenColors: string;
  visualStyle: string[];
  likedDesignSites: string;

  hasTexts: string;
  needCopywriting: string;
  hasPhotos: string;
  needPhotoSession: string;
  needVideo: string;
  whoWillFillContent: string;

  needFeedbackForms: string;
  needChat: string;
  needCrm: string;
  crmName: string;
  needOneC: string;
  needPaymentSystems: string;
  paymentSystems: string;
  needCalculator: string;
  needBlog: string;
  needReviews: string;
  needMap: string;

  hasDomain: string;
  hasHosting: string;
  needCms: string;
  cmsPreference: string;
  needAdminPanel: string;
  whoMaintains: string;
  needSeo: string;
  needAnalytics: string;

  planningContextAds: string;
  planningSeoPromotion: string;
  planningTargetAds: string;
  needLandingPages: string;
  hasUtp: string;

  launchDate: string;
  hasDeadline: string;
  deadlineDate: string;
  budget: string;
  phasedDevelopment: string;

  needPrivacyPolicy: string;
  needOffer: string;
  personalDataProcessing: string;
  needCookieNotice: string;

  needTechSupport: string;
  needFutureImprovements: string;
  needSupportContract: string;

  mainDifference: string;
  whyPickYouStrategy: string;
  desiredBrandImage: string;
  mandatoryHomepageBlocks: string;
  successInSixMonths: string;
};

const yesNoOptions = ["Да", "Нет", "Не знаю"];

const sections: SectionConfig[] = [
  {
    id: "general",
    title: "1. Общая информация о проекте",
    questions: [
      { key: "companyName", label: "Как называется компания?", type: "text", required: true },
      { key: "businessSphere", label: "В какой сфере работаете?", type: "text", required: true },
      { key: "businessModel", label: "Это B2B или B2C?", type: "select", required: true, options: ["B2B", "B2C", "B2B/B2C"] },
      { key: "regions", label: "В каких регионах/странах работает бизнес?", type: "text" },
      { key: "currentSite", label: "Есть ли текущий сайт? (ссылка)", type: "text" },
      { key: "redesignReason", label: "Почему решили сделать новый сайт/редизайн?", type: "textarea" },
      { key: "mainProblems", label: "Какие основные проблемы нужно решить?", type: "textarea" },
    ],
  },
  {
    id: "goals",
    title: "2. Цели сайта",
    questions: [
      {
        key: "mainGoal",
        label: "Главная цель сайта",
        type: "multiselect",
        required: true,
        options: ["Продажи", "Лидогенерация", "Презентация компании", "Онлайн-запись", "Интернет-магазин", "Другое"],
      },
      { key: "kpi", label: "Какие KPI важны?", type: "textarea" },
      { key: "targetAction", label: "Какие действия пользователь должен совершать на сайте?", type: "textarea" },
    ],
  },
  {
    id: "audience",
    title: "3. Целевая аудитория",
    questions: [
      { key: "targetClient", label: "Кто ваш основной клиент?", type: "textarea" },
      { key: "audienceAgeGenderIncome", label: "Возраст, пол, доход?", type: "text" },
      { key: "b2bDecisionMaker", label: "B2B: кто принимает решение?", type: "text" },
      { key: "clientPain", label: "Какие боли у клиента?", type: "textarea" },
      { key: "whyChooseYou", label: "Почему клиент выбирает вас?", type: "textarea" },
      { key: "currentAcquisition", label: "Как клиент сейчас находит вас?", type: "textarea" },
    ],
  },
  {
    id: "product",
    title: "4. Продукт / услуги",
    questions: [
      { key: "productsServices", label: "Какие товары или услуги нужно представить?", type: "textarea" },
      { key: "positionsCount", label: "Сколько позиций?", type: "text" },
      { key: "needCatalog", label: "Нужен ли каталог?", type: "select", options: yesNoOptions },
      { key: "needFilters", label: "Нужна ли фильтрация?", type: "select", options: yesNoOptions },
      { key: "needProductCards", label: "Нужны ли карточки товара?", type: "select", options: yesNoOptions },
      { key: "publicPrices", label: "Будут ли цены публичными?", type: "select", options: yesNoOptions },
      { key: "needOnlinePayment", label: "Нужна ли онлайн-оплата?", type: "select", options: yesNoOptions },
    ],
  },
  {
    id: "competitors",
    title: "5. Конкуренты",
    questions: [
      { key: "competitors", label: "Назовите 3-5 конкурентов", type: "textarea" },
      { key: "competitorLikes", label: "Что нравится в их сайтах?", type: "textarea" },
      { key: "competitorDislikes", label: "Что НЕ нравится?", type: "textarea" },
      { key: "visualReferences", label: "Сайты, которые нравятся визуально (ссылки)", type: "textarea" },
    ],
  },
  {
    id: "structure",
    title: "6. Структура сайта",
    questions: [
      { key: "requiredSections", label: "Какие разделы должны быть?", type: "textarea", rows: 5 },
      { key: "needAccount", label: "Нужен ли личный кабинет?", type: "select", options: yesNoOptions },
      { key: "needMultiLanguage", label: "Нужна ли мультиязычность?", type: "select", options: yesNoOptions },
      { key: "needMobileAdaptation", label: "Нужна ли адаптация под мобильные?", type: "select", options: yesNoOptions },
    ],
  },
  {
    id: "design",
    title: "7. Дизайн",
    questions: [
      { key: "hasBrandStyle", label: "Есть ли фирменный стиль?", type: "select", options: yesNoOptions },
      { key: "hasLogo", label: "Есть ли логотип (вектор)?", type: "select", options: yesNoOptions },
      { key: "hasBrandbook", label: "Есть ли брендбук?", type: "select", options: yesNoOptions },
      { key: "preferredColors", label: "Какие цвета должны быть использованы?", type: "text" },
      { key: "forbiddenColors", label: "Какие цвета нельзя использовать?", type: "text" },
      {
        key: "visualStyle",
        label: "Какой стиль ближе?",
        type: "multiselect",
        options: ["Минимализм", "Корпоративный", "Премиум", "Яркий / креативный", "Тёмный", "Светлый"],
      },
      { key: "likedDesignSites", label: "Какие сайты нравятся визуально?", type: "textarea" },
    ],
  },
  {
    id: "content",
    title: "8. Контент",
    questions: [
      { key: "hasTexts", label: "Есть ли готовые тексты?", type: "select", options: yesNoOptions },
      { key: "needCopywriting", label: "Нужен ли копирайтинг?", type: "select", options: yesNoOptions },
      { key: "hasPhotos", label: "Есть ли профессиональные фото?", type: "select", options: yesNoOptions },
      { key: "needPhotoSession", label: "Нужна ли фотосъёмка?", type: "select", options: yesNoOptions },
      { key: "needVideo", label: "Нужны ли видео?", type: "select", options: yesNoOptions },
      { key: "whoWillFillContent", label: "Кто будет наполнять сайт?", type: "text" },
    ],
  },
  {
    id: "functionality",
    title: "9. Функционал",
    questions: [
      { key: "needFeedbackForms", label: "Нужны ли формы обратной связи?", type: "select", options: yesNoOptions },
      { key: "needChat", label: "Нужен ли чат?", type: "select", options: yesNoOptions },
      { key: "needCrm", label: "Интеграция с CRM?", type: "select", options: yesNoOptions },
      { key: "crmName", label: "Какая CRM?", type: "text" },
      { key: "needOneC", label: "Интеграция с 1С?", type: "select", options: yesNoOptions },
      { key: "needPaymentSystems", label: "Интеграция с платежными системами?", type: "select", options: yesNoOptions },
      { key: "paymentSystems", label: "Какие платежные системы?", type: "text" },
      { key: "needCalculator", label: "Нужен ли калькулятор?", type: "select", options: yesNoOptions },
      { key: "needBlog", label: "Нужен ли блог?", type: "select", options: yesNoOptions },
      { key: "needReviews", label: "Нужны ли отзывы?", type: "select", options: yesNoOptions },
      { key: "needMap", label: "Нужна ли карта?", type: "select", options: yesNoOptions },
    ],
  },
  {
    id: "tech",
    title: "10. Техническая часть",
    questions: [
      { key: "hasDomain", label: "Есть ли домен?", type: "select", options: yesNoOptions },
      { key: "hasHosting", label: "Есть ли хостинг?", type: "select", options: yesNoOptions },
      { key: "needCms", label: "Нужна ли CMS?", type: "select", options: yesNoOptions },
      { key: "cmsPreference", label: "Какая CMS?", type: "text" },
      { key: "needAdminPanel", label: "Нужна ли админ-панель?", type: "select", options: yesNoOptions },
      { key: "whoMaintains", label: "Кто будет поддерживать сайт?", type: "text" },
      { key: "needSeo", label: "Нужна ли SEO-оптимизация?", type: "select", options: yesNoOptions },
      { key: "needAnalytics", label: "Нужна ли аналитика?", type: "select", options: ["Google Analytics", "Яндекс.Метрика", "Обе", "Не нужно", "Не знаю"] },
    ],
  },
  {
    id: "marketing",
    title: "11. Маркетинг",
    questions: [
      { key: "planningContextAds", label: "Планируется ли контекстная реклама?", type: "select", options: yesNoOptions },
      { key: "planningSeoPromotion", label: "Планируется ли SEO-продвижение?", type: "select", options: yesNoOptions },
      { key: "planningTargetAds", label: "Будет ли таргетированная реклама?", type: "select", options: yesNoOptions },
      { key: "needLandingPages", label: "Нужны ли посадочные страницы?", type: "select", options: yesNoOptions },
      { key: "hasUtp", label: "Есть ли УТП?", type: "select", options: yesNoOptions },
    ],
  },
  {
    id: "timeline",
    title: "12. Сроки и бюджет",
    questions: [
      { key: "launchDate", label: "Когда нужен запуск?", type: "text" },
      { key: "hasDeadline", label: "Есть ли дедлайн?", type: "select", options: yesNoOptions },
      { key: "deadlineDate", label: "Дата дедлайна", type: "text" },
      { key: "budget", label: "Какой бюджет заложен?", type: "text" },
      { key: "phasedDevelopment", label: "Планируется ли поэтапная разработка?", type: "select", options: yesNoOptions },
    ],
  },
  {
    id: "legal",
    title: "13. Юридическая часть",
    questions: [
      { key: "needPrivacyPolicy", label: "Нужна ли политика конфиденциальности?", type: "select", options: yesNoOptions },
      { key: "needOffer", label: "Нужна ли оферта?", type: "select", options: yesNoOptions },
      { key: "personalDataProcessing", label: "Будет ли обработка персональных данных?", type: "select", options: yesNoOptions },
      { key: "needCookieNotice", label: "Нужны ли cookie-уведомления?", type: "select", options: yesNoOptions },
    ],
  },
  {
    id: "support",
    title: "14. Поддержка",
    questions: [
      { key: "needTechSupport", label: "Нужна ли техническая поддержка после запуска?", type: "select", options: yesNoOptions },
      { key: "needFutureImprovements", label: "Нужны ли доработки в будущем?", type: "select", options: yesNoOptions },
      { key: "needSupportContract", label: "Нужен ли договор на обслуживание?", type: "select", options: yesNoOptions },
    ],
  },
  {
    id: "strategy",
    title: "Дополнительные стратегические вопросы",
    questions: [
      { key: "mainDifference", label: "В чём ваше главное отличие от конкурентов?", type: "textarea" },
      { key: "whyPickYouStrategy", label: "Почему клиент должен выбрать вас?", type: "textarea" },
      { key: "desiredBrandImage", label: "Какой образ бренда вы хотите транслировать?", type: "textarea" },
      { key: "mandatoryHomepageBlocks", label: "Что обязательно должно быть на главной странице?", type: "textarea" },
      { key: "successInSixMonths", label: "Что будет считаться успешным результатом через 6 месяцев?", type: "textarea" },
    ],
  },
];

const createInitialForm = (): BriefForm => ({
  companyName: "",
  businessSphere: "",
  businessModel: "",
  regions: "",
  currentSite: "",
  redesignReason: "",
  mainProblems: "",

  mainGoal: [],
  kpi: "",
  targetAction: "",

  targetClient: "",
  audienceAgeGenderIncome: "",
  b2bDecisionMaker: "",
  clientPain: "",
  whyChooseYou: "",
  currentAcquisition: "",

  productsServices: "",
  positionsCount: "",
  needCatalog: "",
  needFilters: "",
  needProductCards: "",
  publicPrices: "",
  needOnlinePayment: "",

  competitors: "",
  competitorLikes: "",
  competitorDislikes: "",
  visualReferences: "",

  requiredSections: "Главная\nО компании\nУслуги / Каталог\nКейсы\nБлог\nКонтакты",
  needAccount: "",
  needMultiLanguage: "",
  needMobileAdaptation: "Да",

  hasBrandStyle: "",
  hasLogo: "",
  hasBrandbook: "",
  preferredColors: "",
  forbiddenColors: "",
  visualStyle: [],
  likedDesignSites: "",

  hasTexts: "",
  needCopywriting: "",
  hasPhotos: "",
  needPhotoSession: "",
  needVideo: "",
  whoWillFillContent: "",

  needFeedbackForms: "Да",
  needChat: "",
  needCrm: "",
  crmName: "",
  needOneC: "",
  needPaymentSystems: "",
  paymentSystems: "",
  needCalculator: "",
  needBlog: "",
  needReviews: "",
  needMap: "",

  hasDomain: "",
  hasHosting: "",
  needCms: "",
  cmsPreference: "",
  needAdminPanel: "",
  whoMaintains: "",
  needSeo: "",
  needAnalytics: "",

  planningContextAds: "",
  planningSeoPromotion: "",
  planningTargetAds: "",
  needLandingPages: "",
  hasUtp: "",

  launchDate: "",
  hasDeadline: "",
  deadlineDate: "",
  budget: "",
  phasedDevelopment: "",

  needPrivacyPolicy: "",
  needOffer: "",
  personalDataProcessing: "",
  needCookieNotice: "",

  needTechSupport: "",
  needFutureImprovements: "",
  needSupportContract: "",

  mainDifference: "",
  whyPickYouStrategy: "",
  desiredBrandImage: "",
  mandatoryHomepageBlocks: "",
  successInSixMonths: "",
});

const form = ref<BriefForm>(createInitialForm());
const saveStatusText = ref("Черновик не сохранён");
const submitMessage = ref("");
const submitError = ref(false);
const sending = ref(false);

let saveTimer: ReturnType<typeof setTimeout> | null = null;

const toggleMulti = (key: keyof BriefForm, option: string) => {
  const current = Array.isArray(form.value[key])
    ? ([...(form.value[key] as string[])] as string[])
    : [];

  if (current.includes(option)) {
    form.value[key] = current.filter((item) => item !== option) as BriefForm[keyof BriefForm];
    return;
  }

  form.value[key] = [...current, option] as BriefForm[keyof BriefForm];
};

const saveDraft = () => {
  if (!process.client) return;

  localStorage.setItem(DRAFT_KEY, JSON.stringify(form.value));
  saveStatusText.value = `Черновик сохранён: ${new Date().toLocaleTimeString()}`;
};

const loadDraft = () => {
  if (!process.client) return;

  const rawDraft = localStorage.getItem(DRAFT_KEY);
  if (!rawDraft) {
    saveStatusText.value = "Черновик пока пуст";
    return;
  }

  try {
    const parsed = JSON.parse(rawDraft) as Partial<BriefForm>;
    form.value = {
      ...createInitialForm(),
      ...parsed,
      mainGoal: Array.isArray(parsed.mainGoal) ? parsed.mainGoal : [],
      visualStyle: Array.isArray(parsed.visualStyle) ? parsed.visualStyle : [],
    };
    saveStatusText.value = "Черновик загружен";
  } catch {
    saveStatusText.value = "Не удалось загрузить черновик";
  }
};

watch(
  form,
  () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 250);
  },
  { deep: true }
);

const clearDraft = () => {
  if (!process.client) return;

  form.value = createInitialForm();
  localStorage.removeItem(DRAFT_KEY);
  saveStatusText.value = "Черновик очищен";
  submitMessage.value = "";
};

const submitBrief = async () => {
  submitMessage.value = "";
  submitError.value = false;

  sending.value = true;
  try {
    await apiFetch("/api/brief", {
      method: "POST",
      body: {
        form: form.value,
      },
    });

    saveDraft();
    submitMessage.value = "Бриф отправлен в Telegram";
  } catch (error) {
    console.error("Failed to send brief:", error);
    submitError.value = true;
    submitMessage.value = "Не удалось отправить бриф. Проверьте подключение и повторите.";
  } finally {
    sending.value = false;
  }
};

onMounted(async () => {
  await initAuth();

  if (!isAuthenticated.value) {
    await router.push("/login");
    return;
  }

  await refreshUser();
  loadDraft();
});
</script>

<style scoped lang="scss">
.brief-page {
  padding: 2rem 0 3rem;

  .container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 1rem;
  }
}

.page-header {
  margin-bottom: 1.5rem;

  h1 {
    margin: 0 0 0.5rem;
    color: var(--color-text);
    font-size: 2rem;
  }

  p {
    margin: 0;
    color: var(--color-text);
    opacity: 0.85;
  }
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;

  .draft-status {
    color: var(--color-text);
    font-size: 0.95rem;
  }

  .clear-btn {
    border: 1px solid var(--border-color);
    background: transparent;
    color: var(--color-text);
    padding: 0.6rem 1rem;
    border-radius: 8px;
    cursor: pointer;
  }
}

.brief-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.question-section {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--background-color);
  padding: 1.25rem;

  h2 {
    margin: 0 0 1rem;
    color: var(--color-text);
    font-size: 1.2rem;
  }
}

.questions-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;

  label {
    color: var(--color-text);
    font-size: 0.95rem;
    font-weight: 500;
  }

  input,
  select,
  textarea {
    width: 100%;
    border: 1px solid var(--border-color);
    background: var(--background-color);
    color: var(--color-text);
    border-radius: 8px;
    padding: 0.7rem 0.8rem;
    font-size: 0.95rem;

    &:focus {
      outline: none;
      border-color: #3f8efc;
      box-shadow: 0 0 0 3px rgba(63, 142, 252, 0.15);
    }
  }

  textarea {
    resize: vertical;
    min-height: 90px;
  }
}

.required {
  color: #d94848;
}

.checkbox-grid {
  display: grid;
  gap: 0.5rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text);
  font-size: 0.92rem;

  input {
    width: 16px;
    height: 16px;
    margin: 0;
  }
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .submit-btn {
    border: none;
    border-radius: 10px;
    padding: 0.85rem 1.2rem;
    color: #fff;
    background: linear-gradient(135deg, #2f6fed 0%, #2aa89f 100%);
    font-weight: 600;
    cursor: pointer;

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }
}

.submit-message {
  margin: 0;
  font-size: 0.95rem;

  &.success {
    color: #0f8a4b;
  }

  &.error {
    color: #c43d3d;
  }
}

@media (max-width: 900px) {
  .questions-grid {
    grid-template-columns: 1fr;
  }

  .status-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
