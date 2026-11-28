<template>
  <NuxtLayout>
    <main id="main-content" class="case-page" tabindex="-1">
      <div class="case-shell">
        <nav class="breadcrumbs" aria-label="Путь к странице">
          <NuxtLink :to="catalogLocation"><span aria-hidden="true">←</span> Все проекты</NuxtLink>
        </nav>

        <header class="case-hero">
          <div class="case-intro">
            <p class="case-kind">{{ view.ownershipLabel }}</p>
            <h1>{{ caseProject.title }}</h1>
            <p class="case-summary">{{ view.productSummary }}</p>
            <p v-if="view.role" class="case-role">{{ view.role }}</p>
            <a v-if="links.liveUrl || links.githubUrl" class="hero-link" href="#case-demo">
              Смотреть демонстрацию <span aria-hidden="true">↓</span>
            </a>
          </div>

          <div class="hero-cover">
            <div class="hero-preview">
              <ProjectPreview :src="caseProject.image" :alt="cover?.alt" :title="caseProject.title" priority />
            </div>
          </div>
        </header>

        <div class="case-details">
          <div class="case-narrative">
            <section class="case-section" aria-labelledby="case-task">
              <h2 id="case-task">Задача</h2>
              <p>{{ publication.task }}</p>
            </section>

            <section v-if="view.responsibilities.length" class="case-section" aria-labelledby="case-contribution">
              <h2 id="case-contribution">Личный вклад</h2>
              <ul class="case-points">
                <li v-for="item in view.responsibilities" :key="item">{{ item }}</li>
              </ul>
            </section>

            <section class="case-section" aria-labelledby="case-outcome">
              <h2 id="case-outcome">Результат</h2>
              <p>{{ publication.outcome }}</p>
            </section>
          </div>

          <aside class="case-sidebar" aria-label="Технологии и демонстрация проекта">
            <section v-if="view.technologies.length" class="sidebar-panel" aria-labelledby="case-technologies">
              <h2 id="case-technologies">Технологии</h2>
              <ul class="case-stack" role="list">
                <li v-for="tool in view.technologies" :key="tool">{{ tool }}</li>
              </ul>
              <ul v-if="view.technicalHighlights.length" class="case-points">
                <li v-for="item in view.technicalHighlights" :key="item">{{ item }}</li>
              </ul>
            </section>

            <section v-if="links.liveUrl || links.githubUrl" id="case-demo" class="sidebar-panel" aria-labelledby="case-demo-heading">
              <h2 id="case-demo-heading">Демонстрация</h2>
              <div class="demo-links">
                <a v-if="links.liveUrl" :href="links.liveUrl" target="_blank" rel="noopener noreferrer">
                  Открыть сайт <span aria-hidden="true">↗</span>
                </a>
                <a v-if="links.githubUrl" :href="links.githubUrl" target="_blank" rel="noopener noreferrer">
                  Репозиторий <span aria-hidden="true">↗</span>
                </a>
              </div>
            </section>
          </aside>
        </div>

        <section class="case-contact" aria-labelledby="case-contact-heading">
          <h2 id="case-contact-heading">Хотите обсудить похожую задачу?</h2>
          <NuxtLink to="/contact#contact-form">Связаться со мной <span aria-hidden="true">→</span></NuxtLink>
        </section>
      </div>
    </main>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Project } from "~/composables/useProjects";
import { getPortfolioCover, getPortfolioPublicationBySlug, portfolioCasePath, portfolioOpenGraphCover } from "~/constants/portfolio-publications";
import { getPortfolioOwnershipFromQuery, portfolioOwnershipQuery } from "~/utils/project-ownership";
import { getVerifiedProjectLinks } from "~/utils/project-case-links";
import { getProjectCaseView } from "~/utils/project-case-view";

definePageMeta({ key: (route) => route.path });

const notFound = () => createError({ statusCode: 404, statusMessage: "Project case not found", message: "Кейс не найден", fatal: true });
const route = useRoute();
const slug = route.params.slug;
const publication = typeof slug === "string" ? getPortfolioPublicationBySlug(slug) : undefined;
if (!publication) throw notFound();

const { data: project, error } = await useAsyncData<Project>(
  `portfolio-case:${publication.slug}`,
  () => $fetch<Project>(`/api/projects/${publication.id}`)
);
if (error.value?.statusCode === 404) throw notFound();
if (error.value) throw createError({ statusCode: 503, statusMessage: "Project case unavailable", message: "Кейс временно недоступен", fatal: true });

const caseProject = project.value;
const ownershipType = caseProject?.caseStudy?.ownershipType;
if (!caseProject || !ownershipType || ownershipType === "UNVERIFIED" || caseProject.caseSlug !== publication.slug) {
  throw notFound();
}
const catalogLocation = computed(() => ({
  path: "/projects",
  query: { type: portfolioOwnershipQuery[getPortfolioOwnershipFromQuery(route.query.type) ?? ownershipType] },
}));
const view = getProjectCaseView(caseProject);
const links = getVerifiedProjectLinks(caseProject);
const cover = getPortfolioCover(caseProject.image);
const socialCover = cover ?? portfolioOpenGraphCover;
const siteUrl = useRuntimeConfig().public.siteUrl;
const canonical = new URL(portfolioCasePath(publication.slug), siteUrl).href;
const ogImage = new URL(socialCover.src, siteUrl).href;
const title = `${caseProject.title} — кейс Кирилла Коваленко`;

useSeoMeta({
  title,
  description: view.productSummary,
  ogTitle: title,
  ogDescription: view.productSummary,
  ogType: "website",
  ogSiteName: "K-Studio",
  ogLocale: "ru_RU",
  ogUrl: canonical,
  ogImage,
  ogImageAlt: socialCover.alt,
  ogImageWidth: socialCover.width,
  ogImageHeight: socialCover.height,
  twitterCard: "summary_large_image",
  twitterTitle: title,
  twitterDescription: view.productSummary,
  twitterImage: ogImage,
  twitterImageAlt: socialCover.alt,
  robots: "index, follow",
});
useHead({ link: [{ rel: "canonical", href: canonical }] });
</script>

<style scoped>
.case-page {
  color: var(--portfolio-text);
  font-family: var(--portfolio-font-sans);
}
.case-shell {
  width: min(var(--portfolio-content-width), calc(100% - 2 * var(--portfolio-gutter)));
  margin-inline: auto;
  padding-block: clamp(1rem, 3vw, 2.5rem) var(--portfolio-section-space);
}
.breadcrumbs a, .hero-link, .demo-links a, .case-contact a {
  display: inline-flex;
  min-height: var(--portfolio-control-compact);
  align-items: center;
  gap: .5rem;
  color: var(--portfolio-accent);
  font-weight: 650;
  text-underline-offset: .23em;
}
.case-shell a:hover { color: var(--portfolio-accent-hover); }
.case-shell a:focus-visible {
  outline: var(--portfolio-focus-width) solid var(--portfolio-accent);
  outline-offset: var(--portfolio-focus-offset);
}
.case-hero {
  display: grid;
  grid-template-columns: minmax(0, .84fr) minmax(0, 1.16fr);
  align-items: center;
  gap: clamp(1.2rem, 4vw, 3.5rem);
  padding: clamp(.9rem, 2.8vw, 2.2rem) 0 clamp(1.8rem, 5vw, 4rem);
  border-bottom: 1px solid var(--portfolio-border);
}
.case-kind { margin: 0 0 .65rem; color: var(--portfolio-accent); font-size: .875rem; font-weight: 650; }
.case-intro h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.65rem);
  font-weight: 650;
  line-height: 1.04;
  letter-spacing: -.06em;
  overflow-wrap: anywhere;
}
.case-summary { max-width: 44ch; margin: .85rem 0 0; color: var(--portfolio-text-secondary); font-size: var(--portfolio-body-large); line-height: 1.6; }
.case-role { margin: .9rem 0 .35rem; font-size: .91rem; font-weight: 650; }
.hero-cover {
  min-width: 0;
  padding: clamp(.5rem, 1.3vw, 1rem);
  border: 1px solid var(--portfolio-border);
  border-radius: var(--portfolio-radius-lg);
  background: var(--portfolio-bg-elevated);
  box-shadow: var(--portfolio-shadow-soft);
}
.hero-preview {
  display: grid;
  aspect-ratio: 2 / 1;
  min-height: 0;
  overflow: hidden;
  border-radius: var(--portfolio-radius-md);
}
.case-details {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(15rem, .75fr);
  gap: clamp(1.4rem, 6vw, 5.5rem);
  margin-block: clamp(1.4rem, 4vw, 3rem);
}
.case-narrative, .case-sidebar { display: grid; align-content: start; gap: clamp(.9rem, 2.4vw, 1.65rem); min-width: 0; }
.case-section { padding: 0 0 clamp(1rem, 2vw, 1.6rem); border-bottom: 1px solid var(--portfolio-border); }
.case-section h2, .case-contact h2 { margin: 0 0 .5rem; font-size: clamp(1.2rem, 2.2vw, 1.65rem); letter-spacing: -.035em; }
.case-section p { max-width: 65ch; margin: 0; color: var(--portfolio-text-secondary); line-height: 1.65; }
.sidebar-panel {
  padding: clamp(.85rem, 2vw, 1.35rem);
  border: 1px solid var(--portfolio-border);
  border-radius: var(--portfolio-radius-lg);
  background: var(--portfolio-bg-elevated);
  scroll-margin-top: 6.2rem;
}
.sidebar-panel h2 { margin: 0 0 .65rem; font-size: 1.1rem; letter-spacing: -.02em; }
.case-stack { display: flex; flex-wrap: wrap; gap: .38rem; margin: .6rem 0; padding: 0; list-style: none; }
.case-stack li {
  padding: .27rem .56rem;
  border: 1px solid var(--portfolio-border);
  border-radius: var(--portfolio-radius-pill);
  color: var(--portfolio-text-secondary);
  font: .73rem var(--portfolio-font-mono);
}
.case-points { display: grid; gap: .4rem; margin: .5rem 0 0; padding-left: 1.3rem; color: var(--portfolio-text-secondary); line-height: 1.6; }
.case-points li::marker { color: var(--portfolio-accent); }
.sidebar-panel .case-points { font-size: .86rem; }
.demo-links { display: flex; flex-wrap: wrap; gap: 0 .9rem; font-size: .9rem; }
.case-contact {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: .3rem 1rem;
  padding-top: 1.15rem;
  border-top: 1px solid var(--portfolio-border);
}
.case-contact h2 { margin: 0; }
@media (max-width: 740px) {
  .case-hero, .case-details { grid-template-columns: minmax(0, 1fr); }
}
</style>
