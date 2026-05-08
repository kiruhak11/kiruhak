<template>
  <NuxtLayout>
    <main class="landing-page">
      <section class="hero-section">
        <div class="container">
          <p class="hero-eyebrow">K-Studio</p>
          <h1 class="hero-title">Разработка сайтов на Vue и Nuxt под задачи бизнеса</h1>
          <p class="hero-subtitle">
            Проектируем, запускаем и развиваем сайты с упором на SEO, интеграции
            и автоматизацию процессов. Стоимость работ начинается от 35 000 ₽.
          </p>
          <div class="hero-actions">
            <button class="cta-button primary" type="button" @click="scrollToForm">
              {{ mainCtaText }}
            </button>
            <a
              class="cta-button secondary"
              href="https://t.me/kiruhak11"
              target="_blank"
              rel="noopener noreferrer"
            >
              Написать в Telegram
            </a>
            <a class="cta-button secondary" href="mailto:kiruhak2005@gmail.com">
              Написать на почту
            </a>
          </div>
          <div class="hero-stack" aria-label="Технологический стек">
            <span v-for="stack in stackItems" :key="stack" class="stack-pill">
              {{ stack }}
            </span>
          </div>
        </div>
      </section>

      <section id="packages" class="section packages-section">
        <div class="container">
          <div class="section-header">
            <h2>Цены и пакеты</h2>
            <p>
              3 понятных пакета с прозрачным объёмом работ. Стоимость всегда
              обсуждаем до старта и фиксируем в плане проекта.
            </p>
          </div>

          <div class="packages-grid">
            <article v-for="pack in packages" :key="pack.name" class="package-card">
              <h3>{{ pack.name }}</h3>
              <p class="package-price">{{ pack.price }}</p>
              <p class="package-timeline">Срок: {{ pack.timeline }}</p>
              <p class="package-description">{{ pack.description }}</p>
              <ul class="package-features">
                <li v-for="feature in pack.features" :key="feature">{{ feature }}</li>
              </ul>
              <button
                type="button"
                class="cta-button ghost"
                @click="scrollToForm"
              >
                Получить бесплатный разбор сайта
              </button>
            </article>
          </div>
        </div>
      </section>

      <section class="section stack-section">
        <div class="container">
          <div class="section-header">
            <h2>Стек и подход</h2>
            <p>
              Работаем на современном стеке: Vue, Nuxt, SEO, интеграции и
              автоматизация. Подключаем CRM, аналитику, формы, уведомления и
              сценарии, которые экономят время команды.
            </p>
          </div>
        </div>
      </section>

      <section class="section cases-section">
        <div class="container">
          <div class="section-header">
            <h2>Кейсы с результатом</h2>
            <p>
              Показываем не только визуал, но и бизнес‑задачу, решение и итог по
              проекту.
            </p>
          </div>

          <div v-if="projectsLoading" class="section-state">Загружаем кейсы...</div>
          <div v-else-if="projectsError" class="section-state error">
            {{ projectsError }}
          </div>

          <div v-else class="cases-grid">
            <article v-for="caseItem in caseItems" :key="caseItem.id" class="case-card">
              <img :src="caseItem.image" :alt="caseItem.title" class="case-image" />
              <div class="case-content">
                <h3>{{ caseItem.title }}</h3>
                <div class="case-tags">
                  <span v-for="tag in caseItem.technologies" :key="`${caseItem.id}-${tag}`">
                    {{ tag }}
                  </span>
                </div>
                <p><strong>Задача:</strong> {{ caseItem.task }}</p>
                <p><strong>Решение:</strong> {{ caseItem.solution }}</p>
                <p><strong>Результат:</strong> {{ caseItem.result }}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="section process-section">
        <div class="container">
          <div class="section-header">
            <h2>Как проходит работа</h2>
            <p>
              Чёткий процесс по этапам, чтобы вы всегда понимали, что происходит
              и когда будет следующий результат.
            </p>
          </div>

          <div class="process-grid">
            <article
              v-for="(step, index) in workSteps"
              :key="step.title"
              class="process-card"
            >
              <span class="step-number">{{ index + 1 }}</span>
              <h3>{{ step.title }}</h3>
              <p>{{ step.description }}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="section support-section">
        <div class="container support-content">
          <h2>Гарантия и поддержка после запуска</h2>
          <p>
            После релиза сопровождаем проект: мониторинг, быстрые исправления,
            помощь с контентом и консультации по развитию.
          </p>
          <ul>
            <li>30 дней гарантии на выполненные работы после запуска.</li>
            <li>Поддержка по контенту, интеграциям и техническим вопросам.</li>
            <li>План доработок и точек роста на 1-3 месяца вперёд.</li>
          </ul>
        </div>
      </section>

      <section id="application-form" class="section form-section">
        <div class="container form-layout">
          <div class="form-intro">
            <h2>Форма заявки</h2>
            <p>
              Заполните короткую форму, и мы подготовим бесплатный разбор сайта и
              оценку проекта с рекомендациями. Ответим в Telegram и продублируем
              на почту.
            </p>
            <div class="messenger-links">
              <a
                href="https://t.me/kiruhak11"
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram
              </a>
              <a
                href="mailto:kiruhak2005@gmail.com"
              >
                kiruhak2005@gmail.com
              </a>
            </div>
          </div>

          <form class="lead-form" @submit.prevent="submitLeadForm">
            <label>
              Имя
              <input v-model="leadForm.name" type="text" required placeholder="Ваше имя" />
            </label>

            <label>
              Telegram или телефон
              <input
                v-model="leadForm.contact"
                type="text"
                placeholder="+7... или @username"
              />
            </label>

            <label>
              Email для ответа
              <input
                v-model="leadForm.email"
                type="email"
                required
                placeholder="kiruhak2005@gmail.com"
              />
            </label>

            <label>
              Ниша / компания
              <input
                v-model="leadForm.business"
                type="text"
                placeholder="Например: юридические услуги"
              />
            </label>

            <label>
              Что нужно сделать
              <textarea
                v-model="leadForm.task"
                rows="4"
                required
                placeholder="Опишите задачу, цели и ожидания"
              ></textarea>
            </label>

            <label>
              Ориентировочный бюджет
              <input
                v-model="leadForm.budget"
                type="text"
                placeholder="Например: от 150 000 ₽"
              />
            </label>

            <button class="cta-button primary" type="submit" :disabled="isSubmitting">
              {{ isSubmitting ? "Отправка..." : mainCtaText }}
            </button>

            <p v-if="formState === 'success'" class="form-message success">
              Заявка отправлена. Свяжемся с вами в ближайшее время.
            </p>
            <p v-if="formState === 'error'" class="form-message error">
              Не удалось отправить заявку. Напишите в Telegram или на почту.
            </p>
          </form>
        </div>
      </section>
    </main>
  </NuxtLayout>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useProjects } from "~/composables/useProjects";

const mainCtaText = "Получить бесплатный разбор сайта и оценку проекта";

const stackItems = ["Vue", "Nuxt", "SEO", "Интеграции", "Автоматизация"];

const packages = [
  {
    name: "Старт",
    price: "от 35 000 ₽",
    timeline: "7-12 дней",
    description: "Лендинг или небольшой сайт для быстрого запуска заявок.",
    features: [
      "Прототип и структура страниц",
      "Адаптивная вёрстка на Vue/Nuxt",
      "Базовая SEO-настройка",
      "Подключение форм и аналитики",
    ],
  },
  {
    name: "Бизнес",
    price: "от 95 000 ₽",
    timeline: "4-6 недель",
    description:
      "Корпоративный сайт с продуманной архитектурой и интеграциями.",
    features: [
      "До 10 ключевых страниц",
      "Интеграция с CRM, почтой и мессенджерами",
      "Техническая SEO-оптимизация",
      "Автоматизация заявок и уведомлений",
    ],
  },
  {
    name: "Рост",
    price: "от 190 000 ₽",
    timeline: "6-10 недель",
    description: "Сложный проект с кабинетом, сценариями и масштабированием.",
    features: [
      "Проектирование бизнес-логики",
      "Интеграции со сторонними сервисами и API",
      "Расширенная аналитика и события",
      "План развития после запуска",
    ],
  },
];

const fallbackCases = [
  {
    id: "fallback-1",
    title: "Корпоративный сайт производственной компании",
    image: "https://placehold.co/640x360?text=Corporate+Case",
    technologies: ["Nuxt", "SEO", "Интеграции"],
    task: "Увеличить количество входящих заявок и структурировать контент по услугам.",
    solution:
      "Пересобрали структуру, внедрили SEO-страницы, подключили CRM и формы обратной связи.",
    result: "Рост обращений на 47% за 3 месяца после запуска.",
  },
  {
    id: "fallback-2",
    title: "Сайт сервиса с автоматизацией заявок",
    image: "https://placehold.co/640x360?text=Automation+Case",
    technologies: ["Vue", "Nuxt", "Автоматизация"],
    task: "Сократить время обработки заявок менеджерами и убрать ручные операции.",
    solution:
      "Настроили цепочки уведомлений, интеграцию с Telegram и автоматическое распределение лидов.",
    result: "Время обработки обращений сократилось с 40 до 12 минут.",
  },
  {
    id: "fallback-3",
    title: "Редизайн и SEO-перезапуск сайта услуг",
    image: "https://placehold.co/640x360?text=SEO+Case",
    technologies: ["Vue", "SEO", "Интеграции"],
    task: "Повысить видимость сайта в поиске и улучшить конверсию формы заявки.",
    solution:
      "Обновили UX, ускорили загрузку, внедрили SEO-шаблоны и сквозную аналитику.",
    result: "Органический трафик вырос в 2.1 раза за 5 месяцев.",
  },
];

const workSteps = [
  {
    title: "Бесплатный разбор и оценка",
    description:
      "Изучаем текущий сайт или идею, фиксируем задачи, риски и ориентир по бюджету.",
  },
  {
    title: "Проектирование и план",
    description:
      "Согласовываем структуру, функционал, стек, сроки и этапы с понятными результатами.",
  },
  {
    title: "Разработка и интеграции",
    description:
      "Собираем проект на Vue/Nuxt, внедряем SEO, подключаем CRM и автоматизацию.",
  },
  {
    title: "Запуск и поддержка",
    description:
      "Запускаем сайт, проверяем метрики, помогаем с дальнейшими улучшениями.",
  },
];

const {
  projects,
  loading: projectsLoading,
  error: projectsError,
  fetchProjects,
} = useProjects();

const caseItems = computed(() => {
  if (!projects.value.length) {
    return fallbackCases;
  }

  return projects.value.slice(0, 3).map((project) => ({
    id: project.id,
    title: project.title,
    image: project.image || "https://placehold.co/640x360?text=Project",
    technologies: Array.isArray(project.technologies)
      ? project.technologies.slice(0, 4)
      : [],
    task:
      project.challenges ||
      project.shortDescription ||
      project.description ||
      "Сформировать понятный и эффективный сайт под цели бизнеса.",
    solution:
      project.solutions ||
      "Спроектировали структуру, реализовали на Vue/Nuxt и настроили нужные интеграции.",
    result:
      project.results ||
      "Проект запущен и готов к масштабированию рекламных и SEO-каналов.",
  }));
});

const leadForm = ref({
  name: "",
  contact: "",
  email: "",
  business: "",
  task: "",
  budget: "",
});

const isSubmitting = ref(false);
const formState = ref("idle");

const scrollToForm = () => {
  const formSection = document.getElementById("application-form");
  if (formSection) {
    formSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

const buildLeadMessage = () => {
  return [
    "📩 Новая заявка на бесплатный разбор сайта",
    `Имя: ${leadForm.value.name}`,
    `Telegram/телефон: ${leadForm.value.contact || "Не указан"}`,
    `Email: ${leadForm.value.email}`,
    `Ниша/компания: ${leadForm.value.business || "Не указано"}`,
    `Задача: ${leadForm.value.task}`,
    `Бюджет: ${leadForm.value.budget || "Не указан"}`,
    "Канал связи: Telegram и email",
  ].join("\n");
};

const submitLeadForm = async () => {
  formState.value = "idle";
  isSubmitting.value = true;

  try {
    await $fetch("/api/telegram", {
      method: "POST",
      body: {
        phone: leadForm.value.contact || leadForm.value.email,
        message: buildLeadMessage(),
        discount: 0,
      },
    });

    leadForm.value = {
      name: "",
      contact: "",
      email: "",
      business: "",
      task: "",
      budget: "",
    };

    formState.value = "success";
  } catch (error) {
    formState.value = "error";
    console.error("Failed to send lead form:", error);
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  fetchProjects();
});
</script>

<style scoped lang="scss">
.landing-page {
  position: relative;
  isolation: isolate;
  color: var(--color-text);
  padding-bottom: 72px;
  background:
    radial-gradient(circle at 2% 3%, rgba(79, 172, 254, 0.08), transparent 26%),
    radial-gradient(circle at 98% 5%, rgba(250, 112, 154, 0.1), transparent 30%);
  overflow: hidden;
}

.landing-page::before {
  content: "";
  position: absolute;
  left: -8%;
  right: -8%;
  top: -120px;
  height: 260px;
  background:
    radial-gradient(
      44% 90% at 15% 100%,
      color-mix(in srgb, var(--color-accent) 32%, transparent),
      transparent 72%
    ),
    radial-gradient(
      44% 90% at 85% 100%,
      rgba(250, 112, 154, 0.24),
      transparent 72%
    ),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--background-color) 58%, transparent) 0%,
      transparent 100%
    );
  filter: blur(26px);
  opacity: 0.9;
  pointer-events: none;
  z-index: 0;
}

.landing-page > section {
  position: relative;
  z-index: 1;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.section {
  padding: 72px 0;
  position: relative;
}

.hero-section {
  padding: 94px 0 88px;
}

.hero-section::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: -42px;
  height: 120px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--background-color) 62%, transparent) 0%,
    transparent 100%
  );
  filter: blur(20px);
  pointer-events: none;
  z-index: 0;
}

.hero-section .container {
  position: relative;
  z-index: 1;
  padding: 48px;
  border: 1px solid var(--border-color);
  border-radius: 24px;
  background:
    linear-gradient(120deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0)),
    radial-gradient(circle at 10% 10%, rgba(102, 126, 234, 0.17), transparent 38%),
    radial-gradient(circle at 90% 90%, rgba(240, 147, 251, 0.21), transparent 38%),
    color-mix(in srgb, var(--background-color) 82%, transparent);
  box-shadow: 0 18px 35px rgba(20, 29, 55, 0.09);
}

.hero-eyebrow {
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hero-title {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.15;
}

.hero-subtitle {
  margin: 20px 0 0;
  font-size: 1.12rem;
  line-height: 1.7;
  color: var(--color-text-secondary);
  max-width: 760px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 28px;
  flex-wrap: wrap;
}

.cta-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 14px 20px;
  font-size: 0.98rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease;
}

.cta-button.primary {
  background: var(--gradient-primary);
  color: #fff;
}

.cta-button.secondary {
  background: var(--background-color);
  color: var(--color-text);
  border: 1px solid var(--border-color);
}

.cta-button.ghost {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--color-text);
}

.cta-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(102, 126, 234, 0.2);
}

.cta-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.hero-stack {
  margin-top: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stack-pill {
  background: var(--background-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.section-header {
  max-width: 760px;
  margin-bottom: 28px;
}

.section-header h2 {
  margin: 0;
  font-size: clamp(1.65rem, 3vw, 2.25rem);
}

.section-header p {
  margin: 14px 0 0;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.packages-section,
.cases-section,
.form-section {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--background-color-secondary) 68%, transparent),
      color-mix(in srgb, var(--background-color-secondary) 84%, transparent)
    );
}

.packages-section::before,
.cases-section::before,
.form-section::before,
.packages-section::after,
.cases-section::after,
.form-section::after {
  content: "";
  position: absolute;
  left: -2%;
  right: -2%;
  height: 82px;
  pointer-events: none;
  z-index: 0;
}

.packages-section::before,
.cases-section::before,
.form-section::before {
  top: -36px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    color-mix(in srgb, var(--background-color-secondary) 58%, transparent) 100%
  );
  filter: blur(18px);
}

.packages-section::after,
.cases-section::after,
.form-section::after {
  bottom: -36px;
  background: linear-gradient(
    0deg,
    transparent 0%,
    color-mix(in srgb, var(--background-color-secondary) 56%, transparent) 100%
  );
  filter: blur(18px);
}

.packages-section > .container,
.cases-section > .container,
.form-section > .container {
  position: relative;
  z-index: 1;
}

.packages-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.package-card {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--card-shadow);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.package-card:hover {
  transform: translateY(-6px);
  border-color: color-mix(in srgb, var(--color-accent) 55%, var(--border-color));
  box-shadow: 0 22px 32px rgba(102, 126, 234, 0.16);
}

.package-card h3 {
  margin: 0;
  font-size: 1.3rem;
}

.package-price {
  margin: 12px 0 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.package-timeline {
  margin: 10px 0 0;
  color: var(--color-text-secondary);
}

.package-description {
  margin: 14px 0;
  line-height: 1.65;
  color: var(--color-text-secondary);
}

.package-features {
  margin: 0 0 20px;
  padding-left: 18px;
  display: grid;
  gap: 8px;
}

.package-features li {
  line-height: 1.5;
}

.section-state {
  color: var(--color-text-secondary);
}

.section-state.error {
  color: var(--error-color);
}

.cases-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.case-card {
  background: var(--background-color);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  box-shadow: var(--card-shadow);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.case-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 30px rgba(18, 28, 52, 0.12);
}

.case-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.case-content {
  padding: 20px;
}

.case-content h3 {
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.35;
}

.case-content p {
  margin: 12px 0 0;
  line-height: 1.6;
}

.case-tags {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.case-tags span {
  border: 1px solid var(--border-color);
  background: var(--background-color-secondary);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.78rem;
  color: var(--color-text-secondary);
}

.process-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.process-card {
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 20px;
  background: var(--background-color);
  transition: transform 0.25s ease, border-color 0.25s ease;
}

.process-card:hover {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--color-accent) 40%, var(--border-color));
}

.step-number {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  margin-bottom: 12px;
  font-weight: 700;
  color: #fff;
  background: var(--gradient-primary);
}

.process-card h3 {
  margin: 0;
  font-size: 1.06rem;
}

.process-card p {
  margin: 10px 0 0;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.support-section .support-content {
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 28px;
  background: var(--background-color);
}

.support-section h2 {
  margin: 0;
}

.support-section p {
  margin: 12px 0 0;
  color: var(--color-text-secondary);
  line-height: 1.65;
}

.support-section ul {
  margin: 16px 0 0;
  padding-left: 20px;
  display: grid;
  gap: 10px;
}

.support-section li {
  line-height: 1.55;
}

.form-layout {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(320px, 1.1fr);
  gap: 24px;
}

.form-intro h2 {
  margin: 0;
}

.form-intro p {
  margin: 14px 0 0;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.messenger-links {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.messenger-links a {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  text-decoration: none;
  color: var(--color-text);
  font-weight: 600;
  background: var(--background-color);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.messenger-links a:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.lead-form {
  padding: 24px;
  border-radius: 16px;
  border: 1px solid var(--border-color);
  background: var(--background-color);
  box-shadow: 0 14px 24px rgba(15, 23, 42, 0.08);
  display: grid;
  gap: 14px;
}

.lead-form label {
  display: grid;
  gap: 8px;
  font-weight: 600;
}

.lead-form input,
.lead-form textarea {
  width: 100%;
  border: 1px solid var(--input-border);
  background: var(--input-background);
  color: var(--color-text);
  border-radius: 10px;
  padding: 11px 12px;
  font-size: 0.95rem;
}

.lead-form input:focus,
.lead-form textarea:focus {
  outline: none;
  border-color: var(--input-focus);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--input-focus) 22%, transparent);
}

.form-message {
  margin: 0;
  font-size: 0.92rem;
}

.form-message.success {
  color: var(--success-color);
}

.form-message.error {
  color: var(--error-color);
}

@media (max-width: 1024px) {
  .packages-grid,
  .cases-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .process-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .section {
    padding: 56px 0;
  }

  .hero-section {
    padding: 56px 0;
  }

  .hero-section .container {
    padding: 28px 20px;
  }

  .container {
    padding: 0 16px;
  }

  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .packages-grid,
  .cases-grid,
  .process-grid,
  .form-layout {
    grid-template-columns: 1fr;
  }

  .case-image {
    height: 180px;
  }
}
</style>
