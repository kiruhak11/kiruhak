<template>
  <article class="project-card">
    <div class="card-media">
      <ProjectPreview :src="project.image" :title="title" :priority="priority" />
    </div>

    <div class="card-content">
      <p class="card-kind">{{ caseView.ownershipLabel }}</p>
      <component :is="heading" class="project-title">{{ title }}</component>
      <p class="project-summary">{{ caseView.productSummary }}</p>
      <p v-if="caseView.ownershipType !== 'UNVERIFIED' && caseView.role" class="project-role">{{ caseView.role }}</p>
      <ul v-if="caseView.ownershipType !== 'UNVERIFIED' && caseView.technologies.length" class="project-tech" aria-label="Основные технологии">
        <li v-for="tech in caseView.technologies.slice(0, compact ? 3 : 4)" :key="tech">{{ tech }}</li>
      </ul>

      <div class="card-footer">
        <NuxtLink
          v-if="publication"
          class="case-link"
          :to="portfolioCasePath(publication.slug)"
          :aria-label="`Открыть кейс «${title}»`"
        >
          Открыть кейс
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>
        </NuxtLink>
        <button
          v-else
          class="case-link"
          type="button"
          :aria-label="`Подробнее о проекте «${title}»`"
          @click="$emit('open-modal', project)"
        >
          Подробнее
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { DeepReadonly } from "vue";
import type { Project } from "~/composables/useProjects";
import { getPortfolioPublication, portfolioCasePath } from "~/constants/portfolio-publications";
import { getProjectCaseStudy } from "~/constants/project-case-studies";
import { getProjectCaseView } from "~/utils/project-case-view";

const props = withDefaults(defineProps<{
  project: DeepReadonly<Project>;
  priority?: boolean;
  compact?: boolean;
  heading?: "h2" | "h3";
}>(), { priority: false, compact: false, heading: "h2" });

defineEmits<{ "open-modal": [project: DeepReadonly<Project>] }>();

const publication = computed(() => {
  const item = getPortfolioPublication(props.project.id, props.project.caseStudy?.ownershipType);
  return item?.slug === props.project.caseSlug ? item : undefined;
});
const title = computed(() => publication.value?.title ?? props.project.title);
const reviewedDetails = computed(() => publication.value ? getProjectCaseStudy(publication.value.id) : null);
const caseView = computed(() => getProjectCaseView({
  ...props.project,
  caseStudy: reviewedDetails.value
    ? { ...reviewedDetails.value, ownershipType: props.project.caseStudy?.ownershipType ?? reviewedDetails.value.ownershipType }
    : props.project.caseStudy,
}));

</script>

<style scoped>
.project-card {
  display: flex;
  min-width: 0;
  height: 100%;
  flex-direction: column;
  padding: clamp(.55rem, 1vw, .75rem);
  border: 1px solid var(--portfolio-border);
  border-radius: var(--portfolio-radius-lg);
  background: var(--portfolio-bg-elevated);
  box-shadow: var(--portfolio-shadow-soft);
  transition: border-color var(--portfolio-motion-fast), box-shadow var(--portfolio-motion-normal);
}
.project-card:focus-within, .project-card:hover {
  border-color: var(--portfolio-border-hover);
  box-shadow: var(--portfolio-shadow);
}
.card-media {
  display: grid;
  min-height: 0;
  aspect-ratio: 2 / 1;
  overflow: hidden;
  border: 1px solid var(--portfolio-border);
  border-radius: var(--portfolio-radius-md);
}
.card-content {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  padding: clamp(.7rem, 1.4vw, 1.1rem);
}
.card-kind {
  margin: 0;
  color: var(--portfolio-accent);
  font-size: .75rem;
  font-weight: 650;
}
.project-title {
  margin: .45rem 0 0;
  color: var(--portfolio-text);
  font-size: clamp(1.15rem, 1.8vw, 1.55rem);
  line-height: 1.19;
  letter-spacing: -.035em;
  overflow-wrap: anywhere;
}
.project-summary, .project-role {
  margin: .55rem 0 0;
  color: var(--portfolio-text-secondary);
  font-size: .875rem;
  line-height: 1.55;
  overflow-wrap: anywhere;
}
.project-role { color: var(--portfolio-text); font-weight: 600; }
.project-tech {
  display: flex;
  flex-wrap: wrap;
  gap: .35rem;
  margin: .8rem 0 0;
  padding: 0;
  list-style: none;
}
.project-tech li {
  max-width: 100%;
  padding: .23rem .5rem;
  border: 1px solid var(--portfolio-border);
  border-radius: var(--portfolio-radius-pill);
  color: var(--portfolio-text-secondary);
  font-family: var(--portfolio-font-mono);
  font-size: .69rem;
  overflow-wrap: anywhere;
}
.card-footer { margin-top: auto; padding-top: .75rem; }
.case-link {
  display: inline-flex;
  min-height: var(--portfolio-control-compact);
  align-items: center;
  gap: .6rem;
  padding: 0 .75rem;
  border: 1px solid var(--portfolio-border);
  border-radius: var(--portfolio-radius-sm);
  background: var(--portfolio-surface);
  color: var(--portfolio-text);
  font: inherit;
  font-size: .85rem;
  font-weight: 650;
  text-decoration: none;
  cursor: pointer;
}
.case-link:hover { background: var(--portfolio-surface-hover); color: var(--portfolio-accent); }
.case-link:focus-visible { outline: var(--portfolio-focus-width) solid var(--portfolio-accent); outline-offset: var(--portfolio-focus-offset); }
.case-link svg { width: 1rem; height: 1rem; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }
@media (prefers-reduced-motion: reduce) { .project-card { transition: none; } }
</style>
