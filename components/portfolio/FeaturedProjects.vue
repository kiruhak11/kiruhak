<template>
  <section id="featured-projects" class="featured-section" aria-labelledby="featured-title">
    <div class="featured-inner">
      <header class="featured-heading">
        <h2 id="featured-title">Избранные проекты</h2>
        <NuxtLink class="all-projects" to="/projects">Все проекты <span aria-hidden="true">↗</span></NuxtLink>
      </header>

      <p v-if="loading" class="section-state" role="status">Загружаю проекты…</p>
      <p v-else-if="error" class="section-state section-error" role="status">{{ error }}</p>
      <p v-else-if="!items.length" class="section-state">Избранных проектов пока нет.</p>

      <ul v-else class="featured-grid" role="list">
        <li v-for="(project, index) in items" :key="project.id">
          <ProjectCard :project="project" :priority="index === 0" heading="h3" compact />
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Project } from "~/composables/useProjects";

defineProps<{
  items: readonly Project[];
  loading: boolean;
  error: string | null;
}>();
</script>

<style scoped>
.featured-section { padding: clamp(1.25rem, 3vw, 2rem) 0 var(--portfolio-section-space); scroll-margin-top: 6rem; }
.featured-inner {
  width: min(var(--portfolio-content-width), calc(100% - 2 * var(--portfolio-gutter)));
  margin-inline: auto;
  border-top: 1px solid var(--portfolio-border);
}
.featured-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: .45rem 1rem;
  margin: clamp(.9rem, 2.5vw, 1.6rem) 0 1rem;
}
.featured-heading h2 {
  margin: 0;
  color: var(--portfolio-text);
  font-size: var(--portfolio-h2);
  line-height: 1.12;
  letter-spacing: -.045em;
}
.all-projects {
  display: inline-flex;
  min-height: var(--portfolio-control-compact);
  align-items: center;
  gap: .45rem;
  color: var(--portfolio-text);
  font-size: .875rem;
  font-weight: 650;
  text-decoration: underline;
  text-underline-offset: .23em;
}
.all-projects:hover { color: var(--portfolio-accent); }
.all-projects:focus-visible { outline: 2px solid var(--portfolio-accent); outline-offset: 3px; }
.featured-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(.75rem, 2vw, 1.35rem);
  margin: 0;
  padding: 0;
  list-style: none;
}
.section-state { color: var(--portfolio-text-secondary); }
.section-error { color: var(--portfolio-error); }
@media (max-width: 740px) {
  .featured-grid { grid-template-columns: minmax(0, 1fr); }
  .featured-heading h2 { font-size: clamp(1.3rem, 6vw, 1.75rem); }
}
</style>
