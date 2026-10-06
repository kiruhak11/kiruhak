<template>
  <article class="project-card" :class="`ownership-${caseView.ownershipType.toLowerCase()}`">
    <div class="card-media">
      <ProjectPreview
        :src="project.image"
        :alt="`Превью проекта «${project.title}»`"
        :priority="priority"
        img-class="project-image"
        fallback-class="project-image-fallback"
      />
    </div>

    <div class="card-content">
      <div class="card-meta">
        <span
          v-if="caseView.ownershipType !== 'UNVERIFIED'"
          class="ownership-label"
        >
          {{ caseView.ownershipType === 'OWN' ? 'Собственный проект' : 'Участие в проекте' }}
        </span>
        <span class="category-label">{{ project.category }}</span>
        <span v-if="project.featured && caseView.ownershipType !== 'UNVERIFIED'" class="featured-label">Избранный кейс</span>
      </div>

      <h2 class="project-title">{{ project.title }}</h2>
      <p class="project-summary">{{ caseView.productSummary }}</p>

      <p v-if="caseView.role && caseView.ownershipType !== 'UNVERIFIED'" class="project-role">
        <span>Роль</span>{{ caseView.role }}
      </p>

      <div
        v-if="caseView.ownershipType !== 'UNVERIFIED' && caseView.responsibilities.length"
        class="project-contribution"
      >
        <span>Мой вклад</span>
        <ul>
          <li v-for="item in caseView.responsibilities.slice(0, 2)" :key="item">{{ item }}</li>
        </ul>
      </div>

      <ul
        v-if="caseView.ownershipType !== 'UNVERIFIED' && caseView.technologies.length"
        class="project-tech"
        aria-label="Основные технологии"
      >
        <li v-for="tech in caseView.technologies.slice(0, 4)" :key="tech">{{ tech }}</li>
        <li v-if="caseView.technologies.length > 4" class="tech-more">
          +{{ caseView.technologies.length - 4 }}
        </li>
      </ul>

      <div class="card-actions">
        <button
          class="details-button"
          type="button"
          :aria-label="`Подробнее о проекте «${project.title}»`"
          @click="$emit('open-modal', project)"
        >
          Подробнее
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>
        </button>
        <a
          v-if="externalLinks.liveUrl"
          class="production-link"
          :href="externalLinks.liveUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          Production <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { DeepReadonly } from "vue";
import { getVerifiedProjectLinks } from "~/utils/project-case-links";
import { getProjectCaseView } from "~/utils/project-case-view";
import type { Project } from "~/composables/useProjects";

const props = withDefaults(defineProps<{ project: DeepReadonly<Project>; priority?: boolean }>(), { priority: false });
defineEmits<{ (event: "open-modal", project: DeepReadonly<Project>): void }>();

const caseView = computed(() => getProjectCaseView(props.project));
const externalLinks = computed(() => getVerifiedProjectLinks(props.project));
</script>

<style scoped lang="scss">
.project-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--portfolio-border);
  border-radius: var(--portfolio-radius-lg);
  background: var(--portfolio-bg-elevated);
  box-shadow: var(--portfolio-shadow-soft);
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.project-card:hover,
.project-card:focus-within {
  transform: translateY(-2px);
  border-color: var(--portfolio-border-hover);
  box-shadow: var(--portfolio-shadow);
}

.card-media {
  display: grid;
  place-items: center;
  overflow: hidden;
  aspect-ratio: 2 / 1;
  border-bottom: 1px solid var(--portfolio-border);
  background: var(--portfolio-surface-hover);
}

:deep(.project-image) {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 280ms cubic-bezier(.2,.7,.2,1);
}

.project-card:hover :deep(.project-image) { transform: scale(1.025); }
:deep(.project-image-fallback) { height: 100%; min-height: 0; background: var(--portfolio-surface-hover); }

.card-content { display: flex; flex: 1; min-width: 0; flex-direction: column; padding: 1.35rem; }
.card-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem 0.75rem; color: var(--portfolio-text-muted); font-size: 0.72rem; }
.ownership-label { color: var(--portfolio-accent); font-weight: 650; }
.category-label { color: var(--portfolio-text-muted); }
.category-label::before { content: "·"; margin-right: 0.65rem; }
.featured-label { margin-left: auto; font-family: var(--portfolio-font-mono); font-size: 0.65rem; letter-spacing: 0.03em; }
.project-title { margin: 0.75rem 0 0; color: var(--portfolio-text); font-size: 1.25rem; line-height: 1.25; letter-spacing: -0.035em; }
.project-summary { display: -webkit-box; overflow: hidden; margin: 0.6rem 0 0; color: var(--portfolio-text-secondary); font-size: 0.9rem; line-height: 1.55; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.project-role { display: flex; flex-wrap: wrap; gap: 0.45rem; margin: 0.8rem 0 0; color: var(--portfolio-text); font-size: 0.82rem; }
.project-role span,.project-contribution > span { color: var(--portfolio-text-muted); }
.project-contribution { margin-top: 0.9rem; color: var(--portfolio-text-secondary); font-size: 0.8rem; line-height: 1.5; }
.project-contribution > span { display: block; margin-bottom: 0.35rem; }
.project-contribution ul { display: grid; gap: 0.25rem; margin: 0; padding-left: 1rem; }
.project-contribution li::marker { color: var(--portfolio-accent); }
.project-tech { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 1rem 0 0; padding: 0; list-style: none; }
.project-tech li { padding: 0.28rem 0.55rem; border: 1px solid var(--portfolio-border); border-radius: var(--portfolio-radius-pill); color: var(--portfolio-text-secondary); font-family: var(--portfolio-font-mono); font-size: 0.66rem; }
.project-tech .tech-more { color: var(--portfolio-text-muted); }
.card-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.9rem; margin-top: auto; padding-top: 1.15rem; }
.details-button { display: inline-flex; min-height: 42px; align-items: center; gap: 0.5rem; padding: 0 0.8rem; border: 1px solid var(--portfolio-border); border-radius: var(--portfolio-radius-sm); background: var(--portfolio-surface); color: var(--portfolio-text); font: inherit; font-size: 0.82rem; font-weight: 650; cursor: pointer; transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease; }
.details-button svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.6; transition: transform 160ms ease; }
.details-button:hover { border-color: var(--portfolio-border-hover); background: var(--portfolio-surface-hover); color: var(--portfolio-accent); }
.details-button:hover svg { transform: translateX(2px); }
.production-link { color: var(--portfolio-text-secondary); font-size: 0.8rem; font-weight: 600; text-decoration: none; text-underline-offset: 4px; }
.production-link:hover { color: var(--portfolio-accent); text-decoration: underline; }
.details-button:focus-visible,.production-link:focus-visible { outline: 2px solid var(--portfolio-accent); outline-offset: 3px; }
.details-button { min-height: var(--portfolio-control-compact); }

@media (max-width: 520px) { .card-content { padding: 1.05rem; } .project-title { font-size: 1.15rem; } }
@media (prefers-reduced-motion: reduce) { .project-card,:deep(.project-image),.details-button,.details-button svg { transition: none; } .project-card:hover { transform: none; } .project-card:hover :deep(.project-image),.details-button:hover svg { transform: none; } }
</style>
