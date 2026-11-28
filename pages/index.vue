<template>
  <NuxtLayout>
    <main id="main-content" class="landing-page" tabindex="-1">
      <section class="hero-section" aria-labelledby="hero-title">
        <div class="container hero-layout">
          <div class="hero-copy">
            <p class="hero-eyebrow"><span aria-hidden="true"></span>КИРИЛЛ КОВАЛЕНКО <i>/</i> VUE · NUXT</p>
            <h1 id="hero-title" class="hero-title">Создаю веб-продукты <span>— от интерфейса до запуска.</span></h1>
            <p class="hero-subtitle">
              Проектирую интерфейсы, соединяю их с серверной логикой и интеграциями, затем довожу проект до production.
            </p>
            <div class="hero-actions">
              <a class="cta-button primary" href="#featured-projects">
                Посмотреть проекты
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>
              </a>
              <NuxtLink class="cta-button secondary" to="/contact#contact-form">Обсудить задачу</NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <PortfolioFeaturedProjects :items="caseItems" :loading="projectsLoading" :error="projectsError" />

      <section id="about" class="about-section" aria-labelledby="about-title">
        <div class="container about-layout">
          <p class="eyebrow">ОТ ИНТЕРФЕЙСА ДО ЗАПУСКА</p>
          <div>
            <h2 id="about-title">Думаю о продукте целиком — от пользовательского сценария до работающей системы.</h2>
            <p>Я Кирилл, веб-разработчик. В проектах соединяю интерфейс, серверную логику и интеграции, чтобы решение было не только удобным, но и готовым к реальному использованию.</p>
          </div>
        </div>
      </section>

      <PortfolioCapabilitiesSection :groups="skillGroups" />
      <PortfolioProcessSection :steps="workSteps" />
      <PortfolioServicesSection :packages="packages" @choose="scrollToForm" />

      <section id="application-form" class="contact-section" aria-labelledby="contact-title">
        <div class="container form-layout">
          <div class="form-intro">
            <p class="eyebrow">СЛЕДУЮЩИЙ ШАГ</p>
            <h2 id="contact-title">Есть задача или предложение?</h2>
            <p>Напишите, что хотите запустить или улучшить. Я отвечу и помогу определить реалистичный следующий шаг.</p>
            <div class="messenger-links">
              <a :href="publicContact.telegram.href" target="_blank" rel="noopener noreferrer">Telegram</a>
              <a :href="publicContact.email.href">{{ publicContact.email.label }}</a>
            </div>
          </div>

          <PortfolioLeadContactForm id-prefix="lead" :submit-label="mainCtaText" />
        </div>
      </section>
    </main>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Project } from "~/composables/useProjects";
import { publicContact } from "~/constants/public-contact";
import { getFeaturedPortfolioProjects } from "~/utils/featured-projects";
import { portfolioOpenGraphCover } from "~/constants/portfolio-publications";

const siteUrl = useRuntimeConfig().public.siteUrl;
const ogImage = new URL(portfolioOpenGraphCover.src, siteUrl).href;

useSeoMeta({
  title: "Кирилл Коваленко — веб-разработчик Vue/Nuxt",
  description: "Портфолио Кирилла Коваленко: коммерческие сайты, веб-приложения и собственные проекты на Vue, Nuxt и TypeScript. О задачах, реализации и технологиях каждого проекта.",
  ogTitle: "Кирилл Коваленко — веб-разработчик Vue/Nuxt",
  ogDescription: "Веб-продукты на Vue/Nuxt: собственные проекты, коммерческий опыт и технические кейсы.",
  ogType: "website",
  ogUrl: new URL("/", useRuntimeConfig().public.siteUrl).href,
  ogImage,
  ogImageAlt: portfolioOpenGraphCover.alt,
  twitterImage: ogImage,
  twitterCard: "summary_large_image",
  twitterTitle: "Кирилл Коваленко — веб-разработчик Vue/Nuxt",
  twitterDescription: "Веб-продукты на Vue/Nuxt: проекты, коммерческий опыт и технические кейсы.",
  robots: "index, follow",
});
useHead({
  link: [{ rel: "canonical", href: new URL("/", useRuntimeConfig().public.siteUrl).href }],
  script: [{ type: "application/ld+json", innerHTML: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Кирилл Коваленко",
    url: new URL("/", useRuntimeConfig().public.siteUrl).href,
    jobTitle: "Веб-разработчик Vue/Nuxt",
    sameAs: [publicContact.github.href, publicContact.telegram.href],
  }) }],
});

const mainCtaText = "Отправить заявку";

const skillCatalog = [
  { title: "Web-интерфейсы", tools: ["Vue 3", "Nuxt 3", "Nuxt 4", "TypeScript", "SCSS"] },
  { title: "Backend и данные", tools: ["Nitro", "Prisma", "PostgreSQL", "MySQL"] },
  { title: "Развёртывание и интеграции", tools: ["Docker", "Nginx", "Telegram Bot API"] },
];

const packages = [
  {
    name: "Старт",
    price: "от 35 000 ₽",
    timeline: "7–12 дней",
    description: "Лендинг или небольшой сайт для быстрого запуска заявок.",
    features: ["Прототип и структура страниц", "Адаптивная вёрстка на Vue/Nuxt", "Базовая SEO-настройка", "Подключение форм и аналитики"],
  },
  {
    name: "Бизнес",
    price: "от 95 000 ₽",
    timeline: "4–6 недель",
    description: "Корпоративный сайт с продуманной архитектурой и интеграциями.",
    features: ["До 10 ключевых страниц", "Интеграция с CRM, почтой и мессенджерами", "Техническая SEO-оптимизация", "Автоматизация заявок и уведомлений"],
  },
  {
    name: "Рост",
    price: "от 190 000 ₽",
    timeline: "6–10 недель",
    description: "Сложный проект с кабинетом, сценариями и масштабированием.",
    features: ["Проектирование бизнес-логики", "Интеграции со сторонними сервисами и API", "Расширенная аналитика и события", "План развития после запуска"],
  },
];

const workSteps = [
  { title: "Разобрать задачу", description: "Уточняю пользовательские сценарии, содержание и ограничения — фиксируем, что именно должно заработать." },
  { title: "Спроектировать решение", description: "Определяю структуру страниц и данных, серверные части и интеграции, затем согласую план." },
  { title: "Разработать и проверить", description: "Собираю интерфейс и серверную логику, проверяю формы, интеграции и основные сценарии." },
  { title: "Опубликовать", description: "Настраиваю production-размещение и проверяю работу опубликованной версии." },
];

const { data: projects, status: projectsStatus, error: projectsLoadError } = await useAsyncData<Project[]>(
  "public-projects",
  () => $fetch<Project[]>("/api/projects" as string)
);
const projectsLoading = computed(() => projectsStatus.value === "pending");
const projectsError = computed(() => projectsLoadError.value ? "Не удалось загрузить избранные проекты." : null);
const caseItems = computed<Project[]>(() => getFeaturedPortfolioProjects<Project>(projects.value ?? [])
  .filter((project) => project.caseSlug)
  .slice(0, 3));

const skillGroups = computed(() => {
  const featuredTechnologies = new Set(caseItems.value.flatMap((item: Project) => item.technologies));
  return skillCatalog
    .map((group) => ({ ...group, tools: group.tools.filter((tool) => featuredTechnologies.has(tool)) }))
    .filter((group) => group.tools.length > 0);
});

// Логика формы (состояние, идемпотентность, разбор ошибок) живёт в
// composables/useLeadSubmission.ts и используется общей компонентой формы
// на главной странице и на /contact.
const scrollToForm = () => {
  document.getElementById("application-form")?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start",
  });
};

</script>

<style scoped lang="scss">
.landing-page { min-height: 100vh; padding-bottom: var(--portfolio-space-12); background: var(--portfolio-bg); color: var(--portfolio-text); font-family: var(--portfolio-font-sans); }
.landing-page :deep(*) { font-family: inherit; }
.container { width: min(var(--portfolio-content-width), calc(100% - 2 * var(--portfolio-gutter))); margin: 0 auto; }
.hero-section { position: relative; overflow: hidden; padding: clamp(1.8rem, 4.2vw, 3.4rem) 0 clamp(1rem, 2.6vw, 2.1rem); }
.hero-section::before { position: absolute; inset: 0 0 auto; height: 100%; background-image: linear-gradient(var(--portfolio-grid) 1px, transparent 1px), linear-gradient(90deg, var(--portfolio-grid) 1px, transparent 1px); background-size: 56px 56px; mask-image: linear-gradient(180deg, #000, transparent 94%); pointer-events: none; content: ""; }
.hero-layout { position: relative; }
.hero-copy { max-width: 900px; animation: hero-enter 380ms ease-out both; }
.hero-eyebrow,.eyebrow { margin: 0 0 var(--portfolio-space-6); color: var(--portfolio-text-secondary); font-size: var(--portfolio-label); font-weight: 650; letter-spacing: 0.1em; }
.hero-eyebrow { display: flex; align-items: center; gap: 9px; }
.hero-eyebrow > span { width: 7px; height: 7px; flex: 0 0 7px; border-radius: 50%; background: var(--portfolio-accent); }
.hero-eyebrow i { color: var(--portfolio-text-muted); font-style: normal; }
.hero-title { max-width: 900px; margin: 0; color: var(--portfolio-text); font-size: var(--portfolio-h1); font-weight: 650; letter-spacing: -0.065em; line-height: 1.02; }
.hero-title span { color: var(--portfolio-accent); }
.hero-subtitle { max-width: 650px; margin: var(--portfolio-space-6) 0 0; color: var(--portfolio-text-secondary); font-size: var(--portfolio-body-large); line-height: 1.65; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: var(--portfolio-space-8); }
.cta-button { display: inline-flex; min-height: 48px; justify-content: center; align-items: center; gap: 10px; padding: 0 18px; border: 1px solid transparent; border-radius: var(--portfolio-radius-sm); font-size: 0.92rem; font-weight: 650; text-decoration: none; cursor: pointer; transition: transform 160ms ease, background-color 160ms ease, border-color 160ms ease, color 160ms ease; }
.cta-button.primary { border-color: var(--portfolio-accent); background: var(--portfolio-accent); color: var(--portfolio-accent-contrast); }
.cta-button.primary svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.7; }
.cta-button.secondary { border-color: var(--portfolio-border); background: transparent; color: var(--portfolio-text); }
.cta-button:hover { transform: translateY(-1px); border-color: var(--portfolio-border-hover); }
.cta-button.primary:hover { border-color: var(--portfolio-accent-hover); background: var(--portfolio-accent-hover); }
.cta-button.secondary:hover { background: var(--portfolio-surface-hover); }
.cta-button:focus-visible,.messenger-links a:focus-visible { outline: 2px solid var(--portfolio-accent); outline-offset: 3px; }
.cta-button:disabled { cursor: not-allowed; opacity: 0.65; }
@keyframes hero-enter { from { opacity: 0.72; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.about-section { padding: clamp(3rem, 6vw, 5rem) 0; border-top: 1px solid var(--portfolio-border); }
.about-layout { display: grid; grid-template-columns: minmax(180px, 0.42fr) minmax(0, 1fr); gap: clamp(2rem, 7vw, 7rem); }
.about-layout .eyebrow { margin: 0; color: var(--portfolio-accent); }
.about-layout h2 { max-width: 850px; margin: 0; font-size: clamp(1.65rem, 3vw, 2.55rem); line-height: 1.2; letter-spacing: -0.045em; }
.about-layout div > p { max-width: 66ch; margin: 1rem 0 0; color: var(--portfolio-text-secondary); font-size: var(--portfolio-body-large); line-height: 1.7; }
.contact-section { padding: clamp(3.5rem, 7vw, 6rem) 0; border-top: 1px solid var(--portfolio-border); }
.form-layout { display: grid; grid-template-columns: minmax(240px, 0.8fr) minmax(320px, 1.2fr); gap: clamp(2rem, 7vw, 7rem); align-items: start; }
.form-intro { position: sticky; top: 6rem; }
.form-intro .eyebrow { color: var(--portfolio-accent); }
.form-intro h2 { max-width: 16ch; margin: 0; font-size: var(--portfolio-h2); line-height: 1.12; letter-spacing: -0.04em; }
.form-intro > p:not(.eyebrow) { max-width: 42ch; margin: 0.9rem 0 0; color: var(--portfolio-text-secondary); line-height: 1.65; }
.messenger-links { display: flex; flex-wrap: wrap; gap: 0.75rem 1rem; margin-top: 1.25rem; }
.messenger-links a { color: var(--portfolio-text); font-size: var(--portfolio-small); font-weight: 650; text-underline-offset: 4px; }
.about-section,.contact-section { padding-block: var(--portfolio-section-space); }
.cta-button { min-height: var(--portfolio-control-standard); }

@media (max-width: 760px) { .about-layout,.form-layout { grid-template-columns: 1fr; gap: 1.4rem; } .form-intro { position: static; } }
@media (max-width: 520px) { .hero-section { padding: 2rem 0 1.15rem; } .hero-eyebrow { gap: 7px; margin-bottom: 18px; font-size: 0.62rem; letter-spacing: 0.07em; } .hero-title { font-size: clamp(2.25rem, 9.5vw, 3.1rem); line-height: 1.04; letter-spacing: -0.06em; } .hero-subtitle { margin-top: 18px; font-size: 1rem; line-height: 1.55; } .hero-actions { flex-direction: column; align-items: stretch; margin-top: 24px; } .hero-actions .cta-button { width: 100%; } }
@media (prefers-reduced-motion: reduce) { .hero-copy { animation: none; } .cta-button { transition: none; } .cta-button:hover { transform: none; } }
</style>
