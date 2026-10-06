<template>
  <NuxtLayout>
    <main class="landing-page">
      <section class="hero-section">
        <div class="container hero-layout">
          <div class="hero-copy">
            <p class="hero-eyebrow"><span aria-hidden="true"></span>КИРИЛЛ КОВАЛЕНКО <i>/</i> VUE · NUXT</p>
            <h1 class="hero-title">Создаю веб-продукты <span>— от интерфейса до запуска.</span></h1>
            <p class="hero-subtitle">
              Проектирую интерфейсы, соединяю их с серверной логикой и интеграциями, затем довожу проект до production.
            </p>
            <div class="hero-actions">
              <NuxtLink class="cta-button primary" to="/projects">
                Посмотреть проекты
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>
              </NuxtLink>
              <NuxtLink class="cta-button secondary" to="/contact">Обсудить задачу</NuxtLink>
            </div>
            <a
              class="hero-github-link"
              :href="publicContact.github.href"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub {{ publicContact.github.label }}
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 4.5h8v8m-.5-7.5-8 8" /></svg>
            </a>
          </div>

          <aside class="hero-visual" aria-label="Этапы разработки продукта: интерфейс, логика, запуск">
            <div class="visual-heading">
              <span>ПОЛНЫЙ ЦИКЛ РАЗРАБОТКИ</span>
              <span class="visual-code">01—03</span>
            </div>
            <ol class="build-flow">
              <li>
                <span class="flow-index">01</span>
                <span class="flow-rail" aria-hidden="true"><i></i></span>
                <span class="flow-copy"><strong>Интерфейс</strong><small>Vue · Nuxt · TypeScript</small></span>
              </li>
              <li>
                <span class="flow-index">02</span>
                <span class="flow-rail" aria-hidden="true"><i></i></span>
                <span class="flow-copy"><strong>Логика продукта</strong><small>API · данные · интеграции</small></span>
              </li>
              <li>
                <span class="flow-index">03</span>
                <span class="flow-rail" aria-hidden="true"><i></i></span>
                <span class="flow-copy"><strong>Запуск</strong><small>Docker · production</small></span>
              </li>
            </ol>
            <div class="visual-footer">
              <span class="visual-line" aria-hidden="true"></span>
              <span>ОТ ИДЕИ ДО РАБОТАЮЩЕГО ПРОДУКТА</span>
            </div>
          </aside>
        </div>
      </section>

      <section id="about" class="section about-section">
        <div class="container">
          <div class="section-header">
            <h2>Кто я</h2>
            <p>
              Я Кирилл, веб-разработчик. Собираю пользовательские сценарии в законченный продукт:
              проектирую интерфейс, связываю его с серверной логикой и внешними сервисами,
              затем довожу проект до публикации.
            </p>
          </div>
        </div>
      </section>

      <section class="section cases-section">
        <div class="container">
          <div class="section-header">
            <h2>Проекты и моя работа</h2>
            <p>Сначала — о продукте, затем — о задаче и моей технической реализации.</p>
          </div>

          <div v-if="projectsLoading" class="section-state">Загружаем кейсы...</div>
          <div v-else-if="projectsError" class="section-state error">
            {{ projectsError }}
          </div>

          <div v-else-if="caseItems.length" class="cases-grid">
            <article v-for="caseItem in caseItems" :key="caseItem.id" class="case-card">
              <ProjectPreview
                :src="caseItem.image"
                :alt="caseItem.title"
                img-class="case-image"
                fallback-class="case-image-fallback"
              />
              <div class="case-content">
                <h3>{{ caseItem.title }}</h3>
                <p class="case-ownership">
                  {{ caseItem.ownershipType === "OWN" ? "Мой проект" : "Участие в проекте" }}
                  <span v-if="caseItem.role"> · {{ caseItem.role }}</span>
                </p>
                <div class="case-tags">
                  <span v-for="tag in caseItem.technologies" :key="`${caseItem.id}-${tag}`">
                    {{ tag }}
                  </span>
                </div>
                <p class="case-summary">{{ caseItem.summary }}</p>
                <div v-if="caseItem.responsibilities.length" class="case-contribution">
                  <strong>Моя реализация:</strong>
                  <ul>
                    <li v-for="item in caseItem.responsibilities.slice(0, 2)" :key="item">
                      {{ item }}
                    </li>
                  </ul>
                </div>
              </div>
            </article>
          </div>
          <div v-else class="section-state">Публичные проекты появятся здесь после загрузки.</div>
          <NuxtLink class="cta-button secondary all-projects-link" to="/projects">
            Все проекты
          </NuxtLink>
        </div>
      </section>

      <section class="section stack-section">
        <div class="container">
          <div class="section-header">
            <h2>Инструменты в проектах</h2>
            <p>Стек, который используется в представленных сайтах и приложениях.</p>
          </div>
          <div class="skill-groups">
            <article v-for="group in skillGroups" :key="group.title" class="skill-group">
              <h3>{{ group.title }}</h3>
              <div class="skill-tags">
                <span v-for="tool in group.tools" :key="tool">{{ tool }}</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="section process-section">
        <div class="container">
          <div class="section-header">
            <h2>Как веду задачу</h2>
            <p>
              Сначала определяю, что должно заработать, затем выбираю решение и проверяю его в реальных сценариях.
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
          <h2>После запуска</h2>
          <p>
            Могу подключиться к исправлениям и развитию опубликованного продукта.
            Состав и условия поддержки обсуждаем отдельно.
          </p>
          <ul>
            <li>Разобрать техническую проблему и предложить следующий шаг.</li>
            <li>Доработать существующие страницы, формы и интеграции.</li>
            <li>Подготовить выпуск изменений и проверить работу после публикации.</li>
          </ul>
        </div>
      </section>

      <section id="packages" class="section packages-section">
        <div class="container">
          <div class="section-header">
            <h2>Разработка под заказ</h2>
            <p>
              Портфолио — главное, но я также беру задачи на разработку. Ниже — текущие ориентиры
              для типовых форматов; итоговый объём и стоимость фиксируем после обсуждения.
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
              <button type="button" class="cta-button ghost" @click="scrollToForm">
                Обсудить проект
              </button>
            </article>
          </div>
        </div>
      </section>

      <section id="application-form" class="section form-section">
        <div class="container form-layout">
          <div class="form-intro">
            <h2>Напишите мне о проекте</h2>
            <p>
              Коротко опишите задачу и оставьте email для ответа. Сообщение придёт мне в Telegram.
            </p>
            <div class="messenger-links">
              <a
                :href="publicContact.telegram.href"
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram
              </a>
              <a
                :href="publicContact.email.href"
              >
                {{ publicContact.email.label }}
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
                placeholder="name@example.com"
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
              Заявка отправлена. Я свяжусь с вами в ближайшее время.
            </p>
            <p v-if="formState === 'error'" class="form-message error">
            Не удалось отправить заявку. Напишите мне в Telegram или на почту.
            </p>
          </form>
        </div>
      </section>
    </main>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useProjects } from "~/composables/useProjects";
import { publicContact } from "~/constants/public-contact";
import { getProjectCaseView } from "~/utils/project-case-view";

useSeoMeta({
  title: "Кирилл Коваленко — веб-разработчик Vue/Nuxt",
  description: "Портфолио Кирилла Коваленко: коммерческие сайты, веб-приложения и собственные проекты на Vue, Nuxt и TypeScript. О задачах, реализации и технологиях каждого проекта.",
});

const mainCtaText = "Отправить заявку";

const skillGroups = [
  { title: "Frontend", tools: ["Vue 3", "Nuxt 3/4", "TypeScript", "SCSS"] },
  { title: "Backend и данные", tools: ["Node.js / Nitro", "Prisma", "PostgreSQL", "MySQL"] },
  { title: "Production и интеграции", tools: ["Docker", "Nginx", "Telegram Bot API", "SMTP", "SEO"] },
];

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

const workSteps = [
  {
    title: "Разобрать задачу",
    description:
      "Уточняю пользовательские сценарии, содержание и ограничения — фиксируем, что именно должно заработать.",
  },
  {
    title: "Спроектировать решение",
    description:
      "Определяю структуру страниц и данных, серверные части и интеграции, затем согласую план.",
  },
  {
    title: "Разработать и проверить",
    description:
      "Собираю интерфейс и серверную логику, проверяю формы, интеграции и основные сценарии.",
  },
  {
    title: "Опубликовать",
    description:
      "Настраиваю production-размещение и проверяю работу опубликованной версии.",
  },
];

const {
  projects,
  loading: projectsLoading,
  error: projectsError,
  fetchProjects,
} = useProjects();

const caseItems = computed(() => {
  return projects.value
    .filter((project) =>
      ["OWN", "PARTICIPATION"].includes(project.caseStudy?.ownershipType || "") &&
      Boolean(project.caseStudy?.productionUrl)
    )
    .slice(0, 3)
    .map((project) => {
    const view = getProjectCaseView(project);
    return {
      id: project.id,
      title: project.title,
      image: project.image,
      summary: view.productSummary,
      ownershipType: view.ownershipType,
      role: view.role,
      responsibilities: view.responsibilities,
      technologies: view.technologies.slice(0, 4),
    };
  });
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
    "📩 Новая заявка с портфолио Кирилла",
    `Имя: ${leadForm.value.name}`,
    `Telegram/телефон: ${leadForm.value.contact || "Не указан"}`,
    `Email: ${leadForm.value.email}`,
    `Ниша/компания: ${leadForm.value.business || "Не указано"}`,
    `Задача: ${leadForm.value.task}`,
    `Бюджет: ${leadForm.value.budget || "Не указан"}`,
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
  padding-bottom: var(--portfolio-space-16);
  background: var(--portfolio-bg);
  color: var(--portfolio-text);
  font-family: var(--portfolio-font-sans);
}

.landing-page,
.landing-page * { font-family: var(--portfolio-font-sans); }

.landing-page > section {
  position: relative;
  z-index: 1;
}

.container {
  width: min(var(--portfolio-content-width), calc(100% - 2 * var(--portfolio-gutter)));
  max-width: var(--portfolio-content-width);
  margin: 0 auto;
  padding: 0;
}

.section {
  padding: var(--portfolio-space-16) 0;
  position: relative;
}

.hero-section {
  padding: clamp(3.5rem, 7vw, 6.25rem) 0 clamp(3rem, 6vw, 5rem);
}

.hero-section::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 100%;
  background-image: linear-gradient(var(--portfolio-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--portfolio-grid) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(180deg, #000 0%, transparent 92%);
  pointer-events: none;
  z-index: 0;
}

.hero-layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(290px, 0.85fr);
  align-items: center;
  gap: clamp(2.5rem, 7vw, 7rem);
}

.hero-copy { min-width: 0; animation: hero-enter 380ms ease-out both; }

.hero-eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 var(--portfolio-space-6);
  color: var(--portfolio-text-secondary);
  font-size: var(--portfolio-label);
  font-weight: 650;
  letter-spacing: 0.1em;
}

.hero-eyebrow > span {
  width: 7px;
  height: 7px;
  flex: 0 0 7px;
  border-radius: 50%;
  background: var(--portfolio-accent);
}

.hero-eyebrow i { color: var(--portfolio-text-muted); font-style: normal; }

.hero-title {
  max-width: 780px;
  margin: 0;
  color: var(--portfolio-text);
  font-size: var(--portfolio-h1);
  font-weight: 650;
  letter-spacing: -0.065em;
  line-height: 1.02;
}

.hero-title span { color: var(--portfolio-accent); }

.hero-subtitle {
  max-width: 590px;
  margin: var(--portfolio-space-6) 0 0;
  color: var(--portfolio-text-secondary);
  font-size: var(--portfolio-body-large);
  line-height: 1.65;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: var(--portfolio-space-8);
}

.hero-github-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: var(--portfolio-space-6);
  color: var(--portfolio-text-secondary);
  font-size: var(--portfolio-small);
  text-underline-offset: 4px;
  transition: color 160ms ease;
}

.hero-github-link:hover { color: var(--portfolio-text); }
.hero-github-link svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }

.hero-visual {
  position: relative;
  min-width: 0;
  padding: clamp(1.25rem, 3vw, 2rem);
  border: 1px solid var(--portfolio-border);
  border-radius: var(--portfolio-radius-lg);
  background: var(--portfolio-bg-elevated);
  box-shadow: var(--portfolio-shadow-soft);
  animation: hero-enter 420ms 70ms ease-out both;
}

.visual-heading,
.visual-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--portfolio-text-muted);
  font-family: var(--portfolio-font-mono);
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.07em;
}

.visual-heading > span:first-child,
.visual-footer > span:last-child { font-family: var(--portfolio-font-mono); }
.visual-code { color: var(--portfolio-accent); font-variant-numeric: tabular-nums; }

.build-flow {
  display: grid;
  margin: var(--portfolio-space-8) 0;
  padding: 0;
  list-style: none;
}

.build-flow li {
  display: grid;
  min-height: 76px;
  grid-template-columns: 28px 18px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.flow-index { align-self: start; padding-top: 25px; color: var(--portfolio-text-muted); font-family: var(--portfolio-font-mono); font-size: 0.68rem; }
.flow-rail { position: relative; display: grid; height: 100%; place-items: center; }
.flow-rail::before { position: absolute; top: 0; bottom: 0; left: 50%; width: 1px; background: var(--portfolio-border); content: ""; }
.build-flow li:first-child .flow-rail::before { top: 50%; }
.build-flow li:last-child .flow-rail::before { bottom: 50%; }
.flow-rail i { position: relative; z-index: 1; width: 9px; height: 9px; border: 2px solid var(--portfolio-accent); border-radius: 50%; background: var(--portfolio-bg-elevated); }
.flow-copy { display: grid; gap: 5px; }
.flow-copy strong { color: var(--portfolio-text); font-size: 1.05rem; font-weight: 620; letter-spacing: -0.02em; }
.flow-copy small { color: var(--portfolio-text-secondary); font-size: 0.82rem; }
.visual-line { width: 26px; height: 1px; flex: 0 0 26px; background: var(--portfolio-accent); }

@keyframes hero-enter {
  from { opacity: 0.72; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.cta-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border: 1px solid transparent;
  min-height: 48px;
  gap: 10px;
  padding: 0 18px;
  border-radius: var(--portfolio-radius-sm);
  font-size: 0.92rem;
  font-weight: 650;
  text-decoration: none;
  cursor: pointer;
  transition: transform 160ms ease, background-color 160ms ease, border-color 160ms ease, color 160ms ease;
}

.cta-button.primary {
  border-color: var(--portfolio-accent);
  background: var(--portfolio-accent);
  color: var(--portfolio-accent-contrast);
}

.cta-button.primary svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.7; }

.cta-button.secondary {
  background: transparent;
  color: var(--portfolio-text);
  border: 1px solid var(--portfolio-border);
}

.cta-button.ghost {
  background: transparent;
  border: 1px solid var(--portfolio-border);
  color: var(--portfolio-text);
}

.cta-button:hover {
  transform: translateY(-1px);
  border-color: var(--portfolio-border-hover);
}

.cta-button.primary:hover { border-color: var(--portfolio-accent-hover); background: var(--portfolio-accent-hover); }
.cta-button.secondary:hover,.cta-button.ghost:hover { background: var(--portfolio-surface-hover); }
.cta-button:focus-visible,.hero-github-link:focus-visible { outline: 2px solid var(--portfolio-accent); outline-offset: 3px; }

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
  font-size: var(--portfolio-h2);
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

.case-summary { color: var(--color-text-secondary); }

.case-ownership {
  margin: 0 0 12px;
  color: var(--color-accent);
  font-size: 0.82rem;
  font-weight: 650;
}

.case-ownership span { color: var(--color-text-secondary); font-weight: 500; }

.case-contribution { color: var(--color-text-secondary); }

.case-contribution ul { margin: 6px 0 0; padding-left: 20px; }

.case-contribution strong { color: var(--color-text); }

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

.skill-groups {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.skill-group {
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: var(--background-color);
}

.skill-group h3 { margin: 0 0 14px; font-size: 1rem; }

.skill-tags { display: flex; flex-wrap: wrap; gap: 8px; }

.skill-tags span {
  padding: 5px 10px;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  color: var(--color-text-secondary);
  font-size: 0.82rem;
}

.process-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .skill-groups { grid-template-columns: 1fr; }
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

@media (max-width: 960px) {
  .hero-section { padding: 56px 0 44px; }
  .hero-layout { grid-template-columns: minmax(0, 1fr); gap: 30px; }
  .hero-copy { max-width: 760px; }
  .hero-title { max-width: 740px; }
  .hero-visual { width: min(100%, 600px); }
}

@media (max-width: 768px) {
  .section {
    padding: 56px 0;
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

@media (max-width: 520px) {
  .hero-section { padding: 48px 0 36px; }
  .hero-layout { gap: 28px; }
  .hero-eyebrow { gap: 7px; margin-bottom: 18px; font-size: 0.62rem; letter-spacing: 0.07em; }
  .hero-title { font-size: clamp(2.25rem, 9.5vw, 3.1rem); line-height: 1.04; letter-spacing: -0.06em; }
  .hero-subtitle { margin-top: 18px; font-size: 1rem; line-height: 1.55; }
  .hero-actions { flex-direction: column; align-items: stretch; margin-top: 24px; }
  .hero-actions .cta-button { width: 100%; }
  .hero-github-link { margin-top: 15px; }
  .hero-visual { padding: 18px; }
  .visual-heading,.visual-footer { font-size: 0.58rem; }
  .build-flow { margin: 20px 0; }
  .build-flow li { min-height: 68px; }
  .flow-copy strong { font-size: 0.98rem; }
  .flow-copy small { font-size: 0.75rem; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-copy,.hero-visual { animation: none; }
  .cta-button,.hero-github-link { transition: none; }
  .cta-button:hover { transform: none; }
}
</style>
