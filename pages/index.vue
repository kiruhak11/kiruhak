<template>
  <NuxtLayout>
    <main id="main-content" class="landing-page" tabindex="-1">
      <section class="hero-section" aria-labelledby="hero-title">
        <div class="container hero-layout">
          <div class="hero-copy">
            <p class="hero-eyebrow">Кирилл Коваленко · Vue / Nuxt</p>
            <h1 id="hero-title" class="hero-title">Разрабатываю сайты <span>и веб‑сервисы</span></h1>
            <p class="hero-subtitle">
              Проектирую интерфейсы, пишу серверную часть и запускаю продукт.
            </p>
            <div class="hero-actions">
              <a class="cta-button primary" href="#application-form">Обсудить проект</a>
              <NuxtLink class="cta-button secondary" to="/contact#employers">Работодателям</NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <PortfolioFeaturedProjects :items="caseItems" :loading="projectsLoading" :error="projectsError" />

      <PortfolioCapabilitiesSection :groups="skillGroups" />
      <PortfolioProcessSection :steps="workSteps" />
      <PortfolioServicesSection :packages="packages" @choose="scrollToForm" />

      <section id="application-form" tabindex="-1" class="contact-section" aria-labelledby="contact-title">
        <div class="container form-layout">
          <div class="form-intro">
            <h2 id="contact-title">Расскажите о проекте</h2>
            <p>Опишите задачу и примерные сроки. Я отвечу удобным для вас способом.</p>
          </div>

          <PortfolioLeadContactForm id-prefix="lead" />
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
  document.getElementById("application-form")?.focus();
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
.hero-eyebrow { margin: 0 0 .65rem; color: var(--portfolio-text-secondary); font-size: .875rem; font-weight: 650; letter-spacing: .025em; }
.hero-title { max-width: 20ch; margin: 0; color: var(--portfolio-text); font-size: var(--portfolio-h1); font-weight: 650; letter-spacing: -0.05em; line-height: 1.08; text-wrap: balance; }
.hero-title span { color: var(--portfolio-accent); }
.hero-subtitle { max-width: 650px; margin: var(--portfolio-space-6) 0 0; color: var(--portfolio-text-secondary); font-size: var(--portfolio-body-large); line-height: 1.65; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: var(--portfolio-space-8); }
.cta-button { display: inline-flex; min-height: 48px; justify-content: center; align-items: center; gap: 10px; padding: 0 18px; border: 1px solid transparent; border-radius: var(--portfolio-radius-sm); font-size: 0.95rem; font-weight: 650; text-decoration: none; cursor: pointer; transition: transform 160ms ease, background-color 160ms ease, border-color 160ms ease, color 160ms ease; }
.cta-button.primary { border-color: var(--portfolio-accent); background: var(--portfolio-accent); color: var(--portfolio-accent-contrast); }
.cta-button.secondary { border-color: var(--portfolio-control-border); background: transparent; color: var(--portfolio-text); }
.cta-button:hover { transform: translateY(-1px); border-color: var(--portfolio-border-hover); }
.cta-button.primary:hover { border-color: var(--portfolio-accent-hover); background: var(--portfolio-accent-hover); }
.cta-button.secondary:hover { background: var(--portfolio-surface-hover); }
.cta-button:focus-visible,.contact-section:focus-visible { outline: 2px solid var(--portfolio-accent); outline-offset: 3px; }
@keyframes hero-enter { from { opacity: 0.72; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.contact-section { padding: clamp(3.5rem, 7vw, 6rem) 0; border-top: 1px solid var(--portfolio-border); scroll-margin-top: 6rem; }
.form-layout { display: grid; grid-template-columns: minmax(240px, 0.8fr) minmax(320px, 1.2fr); gap: clamp(2rem, 7vw, 7rem); align-items: start; }
.form-intro { position: sticky; top: 6rem; }
.form-intro h2 { max-width: 22ch; margin: 0; font-size: var(--portfolio-h2); line-height: 1.12; letter-spacing: -0.04em; }
.form-intro > p { max-width: 42ch; margin: 0.9rem 0 0; color: var(--portfolio-text-secondary); line-height: 1.65; }
.cta-button { min-height: var(--portfolio-control-standard); }

@media (max-width: 760px) { .form-layout { grid-template-columns: 1fr; gap: 1.4rem; } .form-intro { position: static; } }
@media (max-width: 520px) {
  .hero-section { padding: 1.4rem 0 .75rem; }
  .hero-title { font-size: clamp(2rem, 8.6vw, 2.8rem); }
  .hero-subtitle { margin-top: .75rem; font-size: 1rem; line-height: 1.5; }
  .hero-actions { margin-top: 1rem; }
  .hero-actions .cta-button { padding-inline: .75rem; }
}
@media (max-width: 355px) { .hero-actions .cta-button { flex: 1 1 100%; } }
@media (prefers-reduced-motion: reduce) { .hero-copy { animation: none; } .cta-button { transition: none; } .cta-button:hover { transform: none; } }
</style>
