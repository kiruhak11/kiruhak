<template>
  <div class="project-modal-overlay" @click="$emit('close')">
    <div
      class="project-modal-content"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      tabindex="-1"
      @click.stop
    >
      <button ref="closeButton" class="close-button" type="button" aria-label="Закрыть детали проекта" @click="$emit('close')">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18 6L6 18M6 6L18 18"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <div class="modal-body">
        <!-- Hero Section -->
        <div class="project-hero">
          <div class="project-image-container">
            <ProjectPreview
              :src="project.image"
              :alt="project.title"
              img-class="project-hero-image"
              fallback-class="project-modal-image-fallback"
            />
            <div v-if="project.featured" class="featured-badge">
              ⭐ Избранный проект
            </div>
          </div>

          <div class="project-header-info">
            <h2 id="project-modal-title" class="project-title">
              <GradientText variant="primary">{{ project.title }}</GradientText>
            </h2>
            <div class="project-meta-tags">
              <span class="category-tag">{{ project.category }}</span>
              <span v-if="project.client" class="client-tag"
                >Клиент: {{ project.client }}</span
              >
            </div>
            <p class="project-subtitle">{{ project.description }}</p>
          </div>
        </div>

        <!-- Project Details -->
        <div class="project-content">
          <div class="content-grid">
            <!-- Main Content -->
            <div class="main-content">
              <div class="content-section">
                <h3 class="section-title">Описание проекта</h3>
                <p class="section-text">{{ project.description }}</p>
              </div>

              <div v-if="project.challenges" class="content-section">
                <h3 class="section-title">Вызовы и задачи</h3>
                <p class="section-text">{{ project.challenges }}</p>
              </div>

              <div v-if="project.solutions" class="content-section">
                <h3 class="section-title">Решения</h3>
                <p class="section-text">{{ project.solutions }}</p>
              </div>

              <div v-if="project.results" class="content-section">
                <h3 class="section-title">Результаты</h3>
                <p class="section-text">{{ project.results }}</p>
              </div>
            </div>

            <!-- Sidebar -->
            <div class="sidebar">
              <!-- Project Stats -->
              <div class="sidebar-section">
                <h4 class="sidebar-title">Детали проекта</h4>
                <div class="stats-grid">
                  <div v-if="project.duration" class="stat-item">
                    <div class="stat-icon">⏱️</div>
                    <div class="stat-content">
                      <div class="stat-label">Длительность</div>
                      <div class="stat-value">{{ project.duration }}</div>
                    </div>
                  </div>
                  <div v-if="project.budget" class="stat-item">
                    <div class="stat-icon">💰</div>
                    <div class="stat-content">
                      <div class="stat-label">Бюджет</div>
                      <div class="stat-value">{{ project.budget }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Technologies -->
              <div
                v-if="project.technologies && project.technologies.length"
                class="sidebar-section"
              >
                <h4 class="sidebar-title">Технологии</h4>
                <div class="tech-grid">
                  <span
                    v-for="tech in project.technologies"
                    :key="tech"
                    class="tech-chip"
                  >
                    {{ tech }}
                  </span>
                </div>
              </div>

              <!-- Features -->
              <div
                v-if="project.features && project.features.length"
                class="sidebar-section"
              >
                <h4 class="sidebar-title">Функции</h4>
                <div class="features-list">
                  <div
                    v-for="feature in project.features"
                    :key="feature"
                    class="feature-item"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    {{ feature }}
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div
                v-if="externalLinks.liveUrl || externalLinks.githubUrl"
                class="sidebar-section"
              >
                <h4 class="sidebar-title">Действия</h4>
                <div class="action-buttons">
                  <a
                    v-if="externalLinks.liveUrl"
                    :href="externalLinks.liveUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="action-button primary"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <polyline
                        points="15,3 21,3 21,9"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <line
                        x1="10"
                        y1="14"
                        x2="21"
                        y2="3"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    Посетить сайт
                  </a>
                  <a
                    v-if="externalLinks.githubUrl"
                    :href="externalLinks.githubUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="action-button secondary"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GradientText from "./GradientText.vue";
import { getProjectExternalLinks } from "~/utils/project-links";

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(["close"]);

const externalLinks = computed(() => getProjectExternalLinks(props.project));
const closeButton = ref<HTMLButtonElement | null>(null);
let previousFocus: HTMLElement | null = null;

const handleModalKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    event.preventDefault();
    emitClose();
    return;
  }

  if (event.key !== "Tab") return;
  const content = closeButton.value?.closest<HTMLElement>(".project-modal-content");
  if (!content) return;
  const focusable = Array.from(
    content.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => element.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

const emitClose = () => emit("close");

onMounted(async () => {
  previousFocus = document.activeElement as HTMLElement | null;
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

<style lang="scss" scoped>
.project-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  padding-top: max(20px, env(safe-area-inset-top));
  padding-bottom: max(20px, env(safe-area-inset-bottom));
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.project-modal-content {
  background: var(--background-color);
  border-radius: 24px;
  max-width: 1000px;
  width: 100%;
  max-height: calc(100vh - 40px);
  max-height: calc(100dvh - 40px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  position: relative;
  border: 1px solid var(--border-color);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.4s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.close-button {
  position: absolute;
  top: 20px;
  right: 20px;
  background: var(--background-color-secondary);
  border: 1px solid var(--border-color);
  color: var(--color-text);
  cursor: pointer;
  padding: 12px;
  border-radius: 16px;
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: var(--background-color-hover);
    transform: scale(1.1);
    box-shadow: var(--card-shadow);
  }
}

.modal-body {
  padding: 0;
}

// Hero Section
.project-hero {
  position: relative;
  background: linear-gradient(
    135deg,
    var(--background-color) 0%,
    var(--background-secondary) 100%
  );
  border-radius: 24px 24px 0 0;
  overflow: hidden;
}

.project-image-container {
  position: relative;
  height: 300px;
  overflow: hidden;

  .project-hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.featured-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  background: var(--gradient-primary);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  z-index: 2;
}

.project-header-info {
  padding: 32px;
  text-align: center;
}

.project-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  line-height: 1.2;
}

.project-meta-tags {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.category-tag,
.client-tag {
  background: var(--background-color-secondary);
  border: 1px solid var(--border-color);
  color: var(--color-accent);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.client-tag {
  color: var(--color-text);
}

.project-subtitle {
  color: var(--color-text-secondary);
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
}

// Content Grid
.project-content {
  padding: 32px;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.content-section {
  .section-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 16px 0;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 40px;
      height: 3px;
      background: var(--gradient-primary);
      border-radius: 2px;
    }
  }

  .section-text {
    color: var(--color-text-secondary);
    line-height: 1.7;
    font-size: 1rem;
    margin: 0;
  }
}

// Sidebar
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar-section {
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
}

.sidebar-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 16px 0;
}

// Stats Grid
.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--background-color);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.stat-icon {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 14px;
  color: var(--color-text);
  font-weight: 600;
}

// Tech Grid
.tech-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tech-chip {
  padding: 6px 12px;
  background: var(--background-color);
  border: 1px solid var(--border-color);
  color: var(--color-text);
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-accent);
    color: white;
    transform: translateY(-1px);
  }
}

// Features List
.features-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  color: var(--color-text);
  transition: all 0.2s ease;

  svg {
    color: var(--color-accent);
    flex-shrink: 0;
  }

  &:hover {
    background: var(--color-accent);
    color: white;
    transform: translateX(5px);

    svg {
      color: white;
    }
  }
}

// Action Buttons
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  border-radius: 12px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  font-size: 14px;

  &.primary {
    background: var(--gradient-primary);
    color: white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }
  }

  &.secondary {
    background: var(--background-color);
    color: var(--color-text);
    border: 1px solid var(--border-color);

    &:hover {
      background: var(--background-color-hover);
      transform: translateY(-2px);
      box-shadow: var(--card-shadow);
    }
  }
}

// Responsive Design
@media (max-width: 768px) {
  .project-modal-overlay {
    padding: 0;
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    align-items: flex-end;
  }

  .project-modal-content {
    width: 100%;
    max-width: 100%;
    max-height: calc(100vh - env(safe-area-inset-top));
    max-height: calc(100dvh - env(safe-area-inset-top));
    border-radius: 20px 20px 0 0;
  }

  .project-hero { border-radius: 20px 20px 0 0; }

  .close-button {
    top: 12px;
    right: 12px;
    padding: 9px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--background-color) 88%, transparent);
    backdrop-filter: blur(12px);
  }

  .project-image-container { height: clamp(150px, 28dvh, 240px); }

  .project-header-info {
    padding: 24px;
  }

  .project-title {
    font-size: 2rem;
  }

  .project-content {
    padding: 24px;
  }

  .content-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .project-meta-tags {
    flex-direction: column;
    align-items: center;
  }

  .sidebar-section {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .project-hero-image {
    height: 200px;
  }

  .project-title {
    font-size: 1.5rem;
  }

  .project-content {
    padding: 16px;
  }

  .project-header-info {
    padding: 16px;
  }
}
</style>
