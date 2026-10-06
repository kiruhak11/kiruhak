<template>
  <NuxtLayout>
    <main class="projects-page">
      <div class="container">
        <header class="page-intro">
          <p class="eyebrow">ПОРТФОЛИО / КЕЙСЫ</p>
          <h1>Проекты и продукты</h1>
          <p class="intro-copy">
            От собственных сервисов до коммерческой разработки — с контекстом проекта и моей конкретной ролью.
          </p>
          <p v-if="!loading && !error" class="case-count" aria-live="polite">
            {{ ownProjects.length + participationProjects.length }} подтверждённых кейса
          </p>
        </header>

        <div v-if="loading" class="page-state" role="status">
          <span class="loading-mark" aria-hidden="true"></span>
          Загружаю проекты…
        </div>

        <div v-else-if="error" class="page-state error-state" role="alert">
          <p>{{ error }}</p>
          <button type="button" class="text-action" @click="fetchProjects">Попробовать снова</button>
        </div>

        <template v-else>
          <div
            v-if="ownProjects.length && participationProjects.length"
            class="ownership-tabs"
            role="tablist"
            aria-label="Тип участия в проектах"
          >
            <button
              id="own-projects-tab"
              ref="ownTab"
              type="button"
              role="tab"
              :aria-selected="selectedOwnership === 'OWN'"
              :aria-controls="'ownership-projects-panel'"
              :tabindex="selectedOwnership === 'OWN' ? 0 : -1"
              class="ownership-tab"
              :class="{ active: selectedOwnership === 'OWN' }"
              @click="selectOwnership('OWN')"
              @keydown="handleTabKeydown($event, 'OWN')"
            >
              <span class="tab-label">Мои проекты</span><span class="tab-count">{{ ownProjects.length }}</span>
            </button>
            <button
              id="participation-projects-tab"
              ref="participationTab"
              type="button"
              role="tab"
              :aria-selected="selectedOwnership === 'PARTICIPATION'"
              :aria-controls="'ownership-projects-panel'"
              :tabindex="selectedOwnership === 'PARTICIPATION' ? 0 : -1"
              class="ownership-tab"
              :class="{ active: selectedOwnership === 'PARTICIPATION' }"
              @click="selectOwnership('PARTICIPATION')"
              @keydown="handleTabKeydown($event, 'PARTICIPATION')"
            >
              <span class="tab-label">Участие в проектах</span><span class="tab-count">{{ participationProjects.length }}</span>
            </button>
          </div>
          <h2 v-else-if="ownProjects.length" class="single-category-title">Мои проекты</h2>
          <h2 v-else-if="participationProjects.length" class="single-category-title">Участие в проектах</h2>

          <section
            v-if="ownProjects.length || participationProjects.length"
            id="ownership-projects-panel"
            class="ownership-panel"
            :role="ownProjects.length && participationProjects.length ? 'tabpanel' : undefined"
            :aria-labelledby="ownProjects.length && participationProjects.length ? (selectedOwnership === 'OWN' ? 'own-projects-tab' : 'participation-projects-tab') : undefined"
            :tabindex="ownProjects.length && participationProjects.length ? 0 : undefined"
          >
            <div v-if="selectedProjects.length" class="project-grid">
              <ProjectCard
                v-for="project in selectedProjects"
                :key="project.id"
                :project="project"
                @open-modal="openProjectModal"
              />
            </div>
            <div v-else class="empty-category">
              <h2>{{ selectedOwnership === 'OWN' ? 'Мои проекты' : 'Участие в проектах' }}</h2>
              <p>В этой категории пока нет опубликованных кейсов.</p>
            </div>
          </section>

          <details v-if="unverifiedProjects.length" class="project-archive">
            <summary>
              <span>Архив проектов</span>
              <span class="archive-count">{{ unverifiedProjects.length }}</span>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>
            </summary>
            <p class="archive-intro">Проекты, по которым я пока не публикую сведения о своей роли, вкладе и стеке.</p>
            <ul class="archive-list">
              <li v-for="project in unverifiedProjects" :key="project.id" class="archive-item">
                <div>
                  <h3>{{ project.title }}</h3>
                  <p>{{ getProjectCaseView(project).productSummary }}</p>
                </div>
                <button
                  type="button"
                  class="archive-details"
                  :aria-label="`Подробнее об архивном проекте «${project.title}»`"
                  @click="openProjectModal(project)"
                >Подробнее</button>
              </li>
            </ul>
          </details>

          <div v-if="projects.length === 0" class="empty-page">
            <h2>Пока нет опубликованных кейсов</h2>
            <p>Загляните позже — раздел обновляется по мере подготовки материалов.</p>
          </div>

          <section class="projects-cta" aria-labelledby="projects-cta-title">
            <div>
              <p class="eyebrow">ОБСУДИТЬ ЗАДАЧУ</p>
              <h2 id="projects-cta-title">Нужен похожий продукт или хотите обсудить мой опыт?</h2>
            </div>
            <NuxtLink class="contact-link" to="/contact">
              Написать мне <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>
            </NuxtLink>
          </section>
        </template>

        <ProjectModal
          v-if="selectedProject"
          :project="selectedProject"
          @close="closeProjectModal"
        />
      </div>
    </main>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import type { DeepReadonly } from "vue";
import ProjectCard from "~/components/ProjectCard.vue";
import ProjectModal from "~/components/ProjectModal.vue";
import { useProjects } from "~/composables/useProjects";
import type { Project } from "~/composables/useProjects";
import { groupProjectsByOwnership } from "~/utils/project-ownership";
import { getProjectCaseView } from "~/utils/project-case-view";

useSeoMeta({
  title: "Проекты — Кирилл Коваленко",
  description: "Кейсы Кирилла Коваленко: собственные продукты и подтверждённый вклад в командные веб-проекты, технологии и production-примеры.",
});

const { projects, loading, error, fetchProjects } = useProjects();
const selectedOwnership = ref<"OWN" | "PARTICIPATION">("OWN");
const ownTab = ref<HTMLButtonElement | null>(null);
const participationTab = ref<HTMLButtonElement | null>(null);
const selectedProject = ref<DeepReadonly<Project> | null>(null);

const projectGroups = computed(() => groupProjectsByOwnership(projects.value));
const ownProjects = computed(() => projectGroups.value.OWN);
const participationProjects = computed(() => projectGroups.value.PARTICIPATION);
const unverifiedProjects = computed(() => projectGroups.value.UNVERIFIED);
const selectedProjects = computed(() => selectedOwnership.value === "OWN" ? ownProjects.value : participationProjects.value);

watch(projects, (loadedProjects) => {
  const { OWN, PARTICIPATION } = groupProjectsByOwnership(loadedProjects);
  const hasOwn = OWN.length > 0;
  const hasParticipation = PARTICIPATION.length > 0;
  if (!hasOwn && hasParticipation) selectedOwnership.value = "PARTICIPATION";
  else if (hasOwn) selectedOwnership.value = "OWN";
});

const selectOwnership = (ownership: "OWN" | "PARTICIPATION", focus = false) => {
  selectedOwnership.value = ownership;
  if (focus) {
    nextTick(() => (ownership === "OWN" ? ownTab.value : participationTab.value)?.focus());
  }
};

const handleTabKeydown = (event: KeyboardEvent, current: "OWN" | "PARTICIPATION") => {
  let next: "OWN" | "PARTICIPATION" | null = null;
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") next = current === "OWN" ? "PARTICIPATION" : "OWN";
  else if (event.key === "Home") next = "OWN";
  else if (event.key === "End") next = "PARTICIPATION";
  if (!next) return;
  event.preventDefault();
  selectOwnership(next, true);
};

const openProjectModal = (project: DeepReadonly<Project>) => { selectedProject.value = project; };
const closeProjectModal = () => { selectedProject.value = null; };

onMounted(() => { fetchProjects(); });
</script>

<style scoped lang="scss">
.projects-page { min-height: 60vh; padding: clamp(2.5rem, 5vw, 4.5rem) 0 clamp(3.5rem, 7vw, 6rem); background: var(--portfolio-bg); color: var(--portfolio-text); font-family: var(--portfolio-font-sans); }
.container { width: min(var(--portfolio-content-width), calc(100% - 2 * var(--portfolio-gutter))); margin: 0 auto; }
.page-intro { max-width: 760px; margin: 0 0 2rem; }
.eyebrow { margin: 0 0 0.7rem; color: var(--portfolio-accent); font-size: var(--portfolio-label); font-weight: 700; letter-spacing: 0.12em; }
h1 { margin: 0; color: var(--portfolio-text); font-size: clamp(2rem, 4vw, 3.3rem); line-height: 1.04; letter-spacing: -0.055em; }
.intro-copy { max-width: 62ch; margin: 0.85rem 0 0; color: var(--portfolio-text-secondary); font-size: var(--portfolio-body-large); line-height: 1.6; }
.case-count { margin: 0.85rem 0 0; color: var(--portfolio-text-muted); font-family: var(--portfolio-font-mono); font-size: 0.74rem; }
.page-state,.empty-page { display: grid; justify-items: start; gap: 0.8rem; padding: 2.5rem 0; color: var(--portfolio-text-secondary); }
.page-state p,.empty-page p { margin: 0; }
.error-state { color: var(--portfolio-error); }
.loading-mark { width: 22px; height: 22px; border: 2px solid var(--portfolio-border); border-top-color: var(--portfolio-accent); border-radius: 50%; animation: spin 800ms linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.text-action { padding: 0; border: 0; background: none; color: inherit; font: inherit; font-weight: 650; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.ownership-tabs { display: flex; width: fit-content; max-width: 100%; gap: clamp(0.5rem, 2vw, 1.5rem); margin: 0 0 1.5rem; border-bottom: 1px solid var(--portfolio-border); }
.ownership-tab { display: inline-flex; min-width: 0; min-height: 48px; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.7rem 0.15rem; border: 0; border-bottom: 2px solid transparent; margin-bottom: -1px; background: transparent; color: var(--portfolio-text-muted); font: inherit; font-size: 0.92rem; font-weight: 600; cursor: pointer; transition: color 140ms ease, border-color 140ms ease; }
.ownership-tab:hover { color: var(--portfolio-text); }
.ownership-tab.active { border-bottom-color: var(--portfolio-accent); color: var(--portfolio-text); }
.ownership-tab:focus-visible,.ownership-panel:focus-visible,.text-action:focus-visible,.archive-details:focus-visible,.contact-link:focus-visible { outline: 2px solid var(--portfolio-accent); outline-offset: 3px; }
.tab-label { min-width: 0; }
.tab-count,.archive-count { display: inline-grid; min-width: 1.35rem; height: 1.35rem; place-items: center; padding: 0 0.25rem; border: 1px solid var(--portfolio-border); border-radius: var(--portfolio-radius-pill); color: var(--portfolio-text-muted); font-family: var(--portfolio-font-mono); font-size: 0.66rem; font-weight: 500; }
.ownership-tab.active .tab-count { border-color: var(--portfolio-border-hover); color: var(--portfolio-accent); }
.ownership-panel { min-width: 0; }
.project-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; }
.single-category-title { margin: 0 0 1rem; font-size: var(--portfolio-h2); }
.empty-category { padding: 2rem 0; border-top: 1px solid var(--portfolio-border); color: var(--portfolio-text-secondary); }
.empty-category h2 { margin: 0; color: var(--portfolio-text); font-size: 1.25rem; }
.empty-category p { margin: 0.6rem 0 0; }
.project-archive { margin-top: clamp(2rem, 5vw, 3.5rem); border-top: 1px solid var(--portfolio-border); border-bottom: 1px solid var(--portfolio-border); }
.project-archive summary { display: flex; min-height: 58px; align-items: center; gap: 0.6rem; color: var(--portfolio-text-secondary); font-size: 0.9rem; font-weight: 600; cursor: pointer; list-style: none; }
.project-archive summary::-webkit-details-marker { display: none; }
.project-archive summary svg { width: 18px; height: 18px; margin-left: auto; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; transition: transform 140ms ease; }
.project-archive[open] summary svg { transform: rotate(180deg); }
.project-archive summary:focus-visible { outline: 2px solid var(--portfolio-accent); outline-offset: 3px; }
.archive-intro { max-width: 58ch; margin: 0 0 1rem; color: var(--portfolio-text-muted); font-size: 0.83rem; line-height: 1.5; }
.archive-list { margin: 0; padding: 0; list-style: none; }
.archive-item { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; padding: 1rem 0; border-top: 1px solid var(--portfolio-border); }
.archive-item > div { min-width: 0; }
.archive-item h3 { margin: 0; color: var(--portfolio-text); font-size: 0.95rem; }
.archive-item p { display: -webkit-box; overflow: hidden; max-width: 70ch; margin: 0.3rem 0 0; color: var(--portfolio-text-muted); font-size: 0.8rem; line-height: 1.5; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.archive-details { flex: 0 0 auto; padding: 0.5rem 0; border: 0; background: transparent; color: var(--portfolio-text-secondary); font: inherit; font-size: 0.78rem; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.archive-details:hover { color: var(--portfolio-accent); }
.projects-cta { display: flex; align-items: center; justify-content: space-between; gap: 2rem; margin-top: clamp(2.5rem, 6vw, 4.5rem); padding: clamp(1.25rem, 3vw, 2rem) 0 0; border-top: 1px solid var(--portfolio-border); }
.projects-cta .eyebrow { margin-bottom: 0.55rem; }
.projects-cta h2 { max-width: 34ch; margin: 0; color: var(--portfolio-text); font-size: clamp(1.25rem, 2.2vw, 1.75rem); line-height: 1.25; letter-spacing: -0.03em; }
.contact-link { display: inline-flex; flex: 0 0 auto; min-height: 46px; align-items: center; gap: 0.65rem; padding: 0 0.95rem; border: 1px solid var(--portfolio-border); border-radius: var(--portfolio-radius-sm); color: var(--portfolio-text); font-size: 0.85rem; font-weight: 650; text-decoration: none; transition: border-color 140ms ease, color 140ms ease, background-color 140ms ease; }
.contact-link { min-height: var(--portfolio-control-standard); }
.contact-link svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.6; }
.contact-link:hover { border-color: var(--portfolio-border-hover); background: var(--portfolio-surface-hover); color: var(--portfolio-accent); }

@media (max-width: 760px) { .project-grid { grid-template-columns: 1fr; } .projects-cta { align-items: flex-start; flex-direction: column; gap: 1rem; } }
@media (max-width: 420px) { .ownership-tabs { width: 100%; gap: 0.6rem; } .ownership-tab { flex: 1 1 0; align-items: center; gap: 0.35rem; padding-inline: 0.1rem; font-size: 0.78rem; line-height: 1.2; } .tab-label { text-align: center; } .archive-item { align-items: flex-start; gap: 0.8rem; } }
@media (prefers-reduced-motion: reduce) { .loading-mark { animation: none; } .ownership-tab,.project-archive summary svg,.contact-link { transition: none; } }
</style>
