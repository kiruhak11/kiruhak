<template>
  <div class="project-modal-overlay" @click.self="emitClose">
    <section
      ref="dialog"
      class="project-modal-content"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      aria-describedby="project-modal-summary"
      tabindex="-1"
      @click.stop
    >
      <div class="modal-topbar">
        <div class="modal-labels">
          <span v-if="caseView.ownershipType !== 'UNVERIFIED'" class="ownership-label">
            {{ caseView.ownershipType === 'OWN' ? 'Собственный проект' : 'Участие в проекте' }}
          </span>
          <span v-else class="archive-label">Архивный проект</span>
          <span v-if="project.category" class="category-label">{{ project.category }}</span>
          <span v-if="caseView.company" class="company-label">{{ caseView.company }}</span>
        </div>
        <button
          ref="closeButton"
          class="close-button"
          type="button"
          :aria-label="`Закрыть кейс «${project.title}»`"
          @click="emitClose"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </div>

      <header class="modal-overview">
        <div class="overview-copy">
          <p class="eyebrow">{{ caseView.ownershipType === 'UNVERIFIED' ? 'АРХИВ' : 'CASE STUDY' }}</p>
          <h2 id="project-modal-title">{{ project.title }}</h2>
          <p id="project-modal-summary" class="project-summary">{{ caseView.productSummary }}</p>
          <p v-if="caseView.role && caseView.ownershipType !== 'UNVERIFIED'" class="project-role">
            <span>Моя роль</span>{{ caseView.role }}
          </p>
        </div>
        <div class="modal-media">
          <ProjectPreview
            :src="project.image"
            :alt="`Превью проекта «${project.title}»`"
            img-class="project-hero-image"
            fallback-class="project-modal-image-fallback"
          />
        </div>
      </header>

      <div class="modal-body">
        <div v-if="caseView.ownershipType === 'UNVERIFIED'" class="archive-note">
          <h3>Архивный проект</h3>
          <p>Сведения о моей роли, личном вкладе и использованном стеке здесь не публикую, пока не смогу их подтвердить.</p>
        </div>

        <template v-else>
          <div class="case-details">
            <div class="case-main">
              <section v-if="caseView.responsibilities.length" class="detail-section">
                <p class="section-label">{{ caseView.ownershipType === 'OWN' ? 'СОБСТВЕННЫЙ ПРОДУКТ' : 'МОЯ ЗОНА ОТВЕТСТВЕННОСТИ' }}</p>
                <h3>{{ caseView.ownershipType === 'OWN' ? 'Моя работа' : 'Мой вклад' }}</h3>
                <ul class="detail-list">
                  <li v-for="item in caseView.responsibilities" :key="item">{{ item }}</li>
                </ul>
              </section>

              <section v-if="caseView.technicalHighlights.length" class="detail-section">
                <p class="section-label">{{ caseView.ownershipType === 'OWN' ? 'АРХИТЕКТУРА И РЕАЛИЗАЦИЯ' : 'ЧАСТИ ПРОДУКТА И РЕШЕНИЯ' }}</p>
                <h3>{{ caseView.ownershipType === 'OWN' ? 'Ключевые технические решения' : 'Реализованные части и решения' }}</h3>
                <ul class="detail-list">
                  <li v-for="item in caseView.technicalHighlights" :key="item">{{ item }}</li>
                </ul>
              </section>

              <section v-if="caseView.ownershipType === 'OWN' && externalLinks.liveUrl" class="detail-section current-state">
                <p class="section-label">ТЕКУЩЕЕ СОСТОЯНИЕ</p>
                <h3>Опубликован в production</h3>
                <p>Рабочую версию можно открыть по ссылке в блоке проекта.</p>
              </section>
            </div>

            <aside class="case-sidebar" aria-label="Технологии и ссылки проекта">
              <section v-if="caseView.technologies.length" class="sidebar-section">
                <p class="section-label">STACK</p>
                <h3>Технологии</h3>
                <ul class="tech-list">
                  <li v-for="technology in caseView.technologies" :key="technology">{{ technology }}</li>
                </ul>
              </section>

              <section v-if="externalLinks.liveUrl || externalLinks.githubUrl" class="sidebar-section">
                <p class="section-label">ВНЕШНИЕ ССЫЛКИ</p>
                <h3>Открыть проект</h3>
                <div class="project-links">
                  <a v-if="externalLinks.liveUrl" :href="externalLinks.liveUrl" target="_blank" rel="noopener noreferrer">
                    Production <span aria-hidden="true">↗</span>
                  </a>
                  <a v-if="externalLinks.githubUrl" :href="externalLinks.githubUrl" target="_blank" rel="noopener noreferrer">
                    Исходный код <span aria-hidden="true">↗</span>
                  </a>
                </div>
                <p class="external-note">Ссылки откроются в новой вкладке.</p>
              </section>
            </aside>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import type { DeepReadonly } from "vue";
import { getVerifiedProjectLinks } from "~/utils/project-case-links";
import { getProjectCaseView } from "~/utils/project-case-view";
import type { Project } from "~/composables/useProjects";

const props = defineProps<{ project: DeepReadonly<Project> }>();
const emit = defineEmits<{ close: [] }>();

const caseView = computed(() => getProjectCaseView(props.project));
const externalLinks = computed(() => getVerifiedProjectLinks(props.project));
const dialog = ref<HTMLElement | null>(null);
const closeButton = ref<HTMLButtonElement | null>(null);
let previousFocus: HTMLElement | null = null;

const emitClose = () => emit("close");

const handleModalKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    event.preventDefault();
    emitClose();
    return;
  }
  if (event.key !== "Tab" || !dialog.value) return;

  const focusable = Array.from(dialog.value.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter((element) => element.getClientRects().length > 0);
  if (!focusable.length) {
    event.preventDefault();
    dialog.value.focus();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!dialog.value.contains(document.activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.value)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

onMounted(async () => {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  document.body.classList.add("no-scroll");
  window.addEventListener("keydown", handleModalKeydown);
  await nextTick();
  closeButton.value?.focus();
});

onBeforeUnmount(() => {
  document.body.classList.remove("no-scroll");
  window.removeEventListener("keydown", handleModalKeydown);
  nextTick(() => previousFocus?.focus());
});
</script>

<style scoped lang="scss">
.project-modal-overlay { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 1.25rem; background: var(--portfolio-backdrop); }
.project-modal-content { width: min(100%, 1080px); max-height: calc(100dvh - 2.5rem); overflow: auto; overscroll-behavior: contain; border: 1px solid var(--portfolio-border); border-radius: var(--portfolio-radius-lg); background: var(--portfolio-bg-elevated); color: var(--portfolio-text); box-shadow: var(--portfolio-shadow); animation: modal-enter 180ms ease-out both; }
.modal-topbar { position: sticky; top: 0; z-index: 3; display: flex; min-height: 58px; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.55rem clamp(1rem, 3vw, 1.5rem); border-bottom: 1px solid var(--portfolio-border); background: var(--portfolio-bg-elevated); }
.modal-labels { display: flex; min-width: 0; flex-wrap: wrap; align-items: center; gap: 0.35rem 0.7rem; color: var(--portfolio-text-muted); font-size: 0.72rem; }
.ownership-label { color: var(--portfolio-accent); font-weight: 650; }
.archive-label { color: var(--portfolio-text-muted); }
.category-label::before,.company-label::before { content: "·"; margin-right: 0.7rem; color: var(--portfolio-text-muted); }
.close-button { display: inline-grid; width: 42px; height: 42px; flex: 0 0 42px; place-items: center; border: 1px solid var(--portfolio-border); border-radius: var(--portfolio-radius-sm); background: var(--portfolio-surface); color: var(--portfolio-text); cursor: pointer; transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease; }
.close-button svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-width: 1.7; }
.close-button:hover { border-color: var(--portfolio-border-hover); background: var(--portfolio-surface-hover); color: var(--portfolio-accent); }
.modal-overview { display: grid; grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr); align-items: center; gap: clamp(1.25rem, 4vw, 3rem); padding: clamp(1.25rem, 3vw, 2rem); border-bottom: 1px solid var(--portfolio-border); }
.overview-copy { min-width: 0; }
.eyebrow,.section-label { margin: 0 0 0.6rem; color: var(--portfolio-accent); font-family: var(--portfolio-font-mono); font-size: 0.68rem; font-weight: 650; letter-spacing: 0.1em; }
.overview-copy h2 { margin: 0; color: var(--portfolio-text); font-size: clamp(1.65rem, 3.4vw, 2.8rem); line-height: 1.08; letter-spacing: -0.05em; }
.project-summary { max-width: 56ch; margin: 0.85rem 0 0; color: var(--portfolio-text-secondary); font-size: var(--portfolio-body); line-height: 1.65; }
.project-role { display: flex; flex-wrap: wrap; gap: 0.6rem; margin: 1rem 0 0; color: var(--portfolio-text); font-size: 0.85rem; }
.project-role span { color: var(--portfolio-text-muted); }
.modal-media { display: grid; place-items: center; overflow: hidden; aspect-ratio: 2 / 1; border: 1px solid var(--portfolio-border); border-radius: var(--portfolio-radius-md); background: var(--portfolio-surface-hover); }
:deep(.project-hero-image) { display: block; width: auto; height: auto; max-width: 100%; max-height: 100%; object-fit: contain; }
:deep(.project-modal-image-fallback) { height: 100%; min-height: 0; background: var(--portfolio-surface-hover); }
.modal-body { padding: clamp(1.25rem, 3vw, 2rem); }
.case-details { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(230px, 0.75fr); gap: clamp(1.5rem, 4vw, 3.5rem); }
.case-main { display: grid; align-content: start; gap: 1.75rem; }
.detail-section h3,.sidebar-section h3,.archive-note h3 { margin: 0; color: var(--portfolio-text); font-size: 1.08rem; line-height: 1.3; letter-spacing: -0.02em; }
.detail-section .section-label,.sidebar-section .section-label { margin-bottom: 0.5rem; }
.detail-list { display: grid; gap: 0.55rem; margin: 0.75rem 0 0; padding-left: 1.15rem; color: var(--portfolio-text-secondary); font-size: 0.9rem; line-height: 1.6; }
.detail-list li::marker { color: var(--portfolio-accent); }
.current-state > p:last-child { margin: 0.55rem 0 0; color: var(--portfolio-text-secondary); font-size: 0.85rem; line-height: 1.55; }
.case-sidebar { display: grid; align-content: start; gap: 1.25rem; }
.sidebar-section { padding: 1rem; border: 1px solid var(--portfolio-border); border-radius: var(--portfolio-radius-md); background: var(--portfolio-surface); }
.tech-list { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.8rem 0 0; padding: 0; list-style: none; }
.tech-list li { padding: 0.33rem 0.58rem; border: 1px solid var(--portfolio-border); border-radius: var(--portfolio-radius-pill); color: var(--portfolio-text-secondary); font-family: var(--portfolio-font-mono); font-size: 0.68rem; }
.project-links { display: grid; gap: 0.5rem; margin-top: 0.8rem; }
.project-links a { display: flex; min-height: 42px; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0 0.7rem; border: 1px solid var(--portfolio-border); border-radius: var(--portfolio-radius-sm); color: var(--portfolio-text); font-size: 0.82rem; font-weight: 600; text-decoration: none; transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease; }
.project-links a:hover { border-color: var(--portfolio-border-hover); background: var(--portfolio-surface-hover); color: var(--portfolio-accent); }
.external-note { margin: 0.65rem 0 0; color: var(--portfolio-text-muted); font-size: 0.72rem; line-height: 1.45; }
.archive-note { max-width: 640px; padding: 1rem 1.1rem; border-left: 2px solid var(--portfolio-border); color: var(--portfolio-text-secondary); }
.archive-note p { margin: 0.45rem 0 0; font-size: 0.88rem; line-height: 1.6; }
.close-button:focus-visible,.project-links a:focus-visible { outline: 2px solid var(--portfolio-accent); outline-offset: 3px; }
@keyframes modal-enter { from { opacity: 0; transform: translateY(8px) scale(0.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
@media (max-width: 700px) { .project-modal-overlay { align-items: end; padding: 0; padding-top: env(safe-area-inset-top); } .project-modal-content { width: 100%; max-height: calc(100dvh - env(safe-area-inset-top)); border-radius: var(--portfolio-radius-lg) var(--portfolio-radius-lg) 0 0; padding-bottom: env(safe-area-inset-bottom); } .modal-overview { grid-template-columns: 1fr; gap: 1rem; } .modal-media { grid-row: 2; } .case-details { grid-template-columns: 1fr; } .case-sidebar { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { .project-modal-content { animation: none; } .close-button,.project-links a { transition: none; } }
</style>
