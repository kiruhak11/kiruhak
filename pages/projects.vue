<template>
  <NuxtLayout>
    <main>
      <div class="container">
        <div class="label">
          <h1>
            <GradientText variant="primary">Проекты</GradientText>
          </h1>
          <p class="subtitle">
            Собственные продукты и мой подтверждённый вклад в проекты компаний — отдельно и без смешения ролей.
          </p>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Загружаем проекты...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="error-container">
          <p class="error-message">{{ error }}</p>
          <button @click="fetchProjects" class="retry-button">
            Попробовать снова
          </button>
        </div>

        <!-- Classified projects -->
        <div v-else class="projects-container">
          <div
            v-if="ownProjects.length && participationProjects.length"
            class="ownership-tabs"
            role="tablist"
            aria-label="Категории проектов"
          >
            <button
              id="own-projects-tab"
              ref="ownTab"
              type="button"
              role="tab"
              :aria-selected="selectedOwnership === 'OWN'"
              :tabindex="selectedOwnership === 'OWN' ? 0 : -1"
              aria-controls="ownership-projects-panel"
              class="ownership-tab"
              :class="{ active: selectedOwnership === 'OWN' }"
              @click="selectOwnership('OWN')"
              @keydown="handleTabKeydown($event, 'OWN')"
            >
              Мои проекты <span>{{ ownProjects.length }}</span>
            </button>
            <button
              id="participation-projects-tab"
              ref="participationTab"
              type="button"
              role="tab"
              :aria-selected="selectedOwnership === 'PARTICIPATION'"
              :tabindex="selectedOwnership === 'PARTICIPATION' ? 0 : -1"
              aria-controls="ownership-projects-panel"
              class="ownership-tab"
              :class="{ active: selectedOwnership === 'PARTICIPATION' }"
              @click="selectOwnership('PARTICIPATION')"
              @keydown="handleTabKeydown($event, 'PARTICIPATION')"
            >
              Участие в проектах <span>{{ participationProjects.length }}</span>
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
          <!-- Filters and Search -->
          <div class="filters-section">
            <div class="search-container">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Поиск проектов..."
                class="search-input"
              />
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="search-icon"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="8"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <path
                  d="M21 21L16.65 16.65"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>

            <div class="filter-controls">
              <select v-model="selectedCategory" class="filter-select">
                <option value="">Все категории</option>
                <option
                  v-for="category in availableCategories"
                  :key="category"
                  :value="category"
                >
                  {{ category }}
                </option>
              </select>

              <select v-model="sortBy" class="filter-select">
                <option value="date">По дате</option>
                <option value="name">По названию</option>
                <option value="featured">Избранные</option>
              </select>
            </div>
          </div>

          <!-- Projects count -->
          <div class="projects-count">
            <span>Найдено проектов: {{ filteredProjects.length }}</span>
          </div>

          <div v-if="filteredProjects.length" class="cards">
            <ProjectCard
              v-for="project in filteredProjects"
              :key="project.id"
              :project="project"
              @open-modal="openProjectModal"
            />
          </div>
          <div v-else class="category-empty-state">
            <h2>{{ selectedOwnership === "OWN" ? "Мои проекты" : "Участие в проектах" }}</h2>
            <p>В этой категории пока нет проектов, соответствующих фильтрам.</p>
          </div>
          </section>

          <details v-if="unverifiedProjects.length" class="unverified-projects">
            <summary>
              Ещё {{ unverifiedProjects.length }} проекта — уточняю сведения о своей роли и вкладе
            </summary>
            <p class="unverified-intro">
              Пока не отношу их ни к собственным проектам, ни к участию в командной работе.
            </p>
            <div class="cards">
              <ProjectCard
                v-for="project in unverifiedProjects"
                :key="project.id"
                :project="project"
                @open-modal="openProjectModal"
              />
            </div>
          </details>
        </div>

        <!-- Project Modal -->
        <ProjectModal
          v-if="selectedProject"
          :project="selectedProject"
          @close="closeProjectModal"
        />

        <!-- Empty state -->
        <div
          v-if="!loading && !error && projects.length === 0"
          class="empty-state"
        >
          <h3>Проекты не найдены</h3>
          <p>Пока нет доступных проектов</p>
        </div>

        <div class="cta-section">
          <h2>
            <GradientText variant="secondary">Есть задача для веб-продукта?</GradientText>
          </h2>
          <p>Напишите мне — обсудим задачу, объём и подходящий формат работы.</p>
          <NuxtLink class="cta-button primary" to="/contact">Обсудить проект</NuxtLink>
        </div>
      </div>
    </main>
  </NuxtLayout>
</template>

<script setup lang="ts">
import GradientText from "~/components/GradientText.vue";
import ProjectModal from "~/components/ProjectModal.vue";
import { useProjects } from "~/composables/useProjects";
import type { Project } from "~/composables/useProjects";
import type { ProjectOwnershipType } from "~/types/project-case-study";
useSeoMeta({
  title: "Проекты — Кирилл Коваленко",
  description: "Кейсы Кирилла Коваленко: веб-сайты и приложения на Vue/Nuxt. О продукте, технических задачах, реализации и используемом стеке.",
});

// Используем composable для работы с проектами
const { projects, loading, error, fetchProjects } = useProjects();

// Загружаем проекты при монтировании компонента
onMounted(() => {
  fetchProjects();
});

watch(projects, (loadedProjects) => {
  const hasOwn = loadedProjects.some((project) => getOwnershipType(project) === "OWN");
  const hasParticipation = loadedProjects.some(
    (project) => getOwnershipType(project) === "PARTICIPATION"
  );
  if (!hasOwn && hasParticipation) selectedOwnership.value = "PARTICIPATION";
  else if (hasOwn) selectedOwnership.value = "OWN";
});

// Фильтрация и поиск
const searchQuery = ref("");
const selectedCategory = ref("");
const sortBy = ref("date");
const selectedOwnership = ref<"OWN" | "PARTICIPATION">("OWN");
const ownTab = ref<HTMLButtonElement | null>(null);
const participationTab = ref<HTMLButtonElement | null>(null);

const getOwnershipType = (project: Project): ProjectOwnershipType =>
  project.caseStudy?.ownershipType ?? "UNVERIFIED";

const ownProjects = computed(() =>
  projects.value.filter((project) => getOwnershipType(project) === "OWN")
);
const participationProjects = computed(() =>
  projects.value.filter((project) => getOwnershipType(project) === "PARTICIPATION")
);
const unverifiedProjects = computed(() =>
  projects.value.filter((project) => getOwnershipType(project) === "UNVERIFIED")
);

const selectOwnership = (ownership: "OWN" | "PARTICIPATION", focus = false) => {
  selectedOwnership.value = ownership;
  if (focus) {
    nextTick(() => {
      (ownership === "OWN" ? ownTab.value : participationTab.value)?.focus();
    });
  }
};

const handleTabKeydown = (event: KeyboardEvent, current: "OWN" | "PARTICIPATION") => {
  let next: "OWN" | "PARTICIPATION" | null = null;
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
    next = current === "OWN" ? "PARTICIPATION" : "OWN";
  } else if (event.key === "Home") {
    next = "OWN";
  } else if (event.key === "End") {
    next = "PARTICIPATION";
  }
  if (!next) return;
  event.preventDefault();
  selectOwnership(next, true);
};

// Вычисляемые свойства для фильтрации
const availableCategories = computed(() => {
  const categories = new Set(projects.value.map((project) => project.category));
  return Array.from(categories).sort();
});

const filteredProjects = computed(() => {
  let filtered = projects.value.filter(
    (project) => getOwnershipType(project) === selectedOwnership.value
  );

  // Поиск по названию и описанию
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (project) =>
        project.title.toLowerCase().includes(query) ||
        (project.shortDescription || "").toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        (project.caseStudy?.responsibilities.join(" ") || "").toLowerCase().includes(query) ||
        project.technologies.some((tech) => tech.toLowerCase().includes(query))
    );
  }

  // Фильтрация по категории
  if (selectedCategory.value) {
    filtered = filtered.filter(
      (project) => project.category === selectedCategory.value
    );
  }

  // Сортировка
  switch (sortBy.value) {
    case "name":
      filtered.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "featured":
      filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      break;
    case "date":
    default:
      // Сортировка по дате (если есть поле createdAt)
      filtered.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        return 0;
      });
      break;
  }

  return filtered;
});

// Модальные окна
const selectedProject = ref<Project | null>(null);
const openProjectModal = (project: Project) => {
  selectedProject.value = project;
};
const closeProjectModal = () => {
  selectedProject.value = null;
};

</script>

<style lang="scss" scoped>
.container {
  padding: 0 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.label {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  text-align: center;
}

h1 {
  display: flex;
  justify-content: center;
  padding: 32px 0 16px;
  color: var(--color-text);
  transform: scale(0.9);
  animation: fadeIn 0.7s ease forwards;
  animation-delay: 0.3s;
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 1.1rem;
  margin: 0;
  animation: fadeIn 0.7s ease forwards;
  animation-delay: 0.5s;
  opacity: 0;
}

@keyframes fadeIn {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin: 48px 0;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

// Filters Section
.projects-container {
  .filters-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 32px;
    padding: 24px;
    background: var(--background-secondary);
    border-radius: 16px;
    border: 1px solid var(--border-color);

    @media (max-width: 768px) {
      padding: 16px;
    }
  }

  .search-container {
    position: relative;
    max-width: 400px;

    .search-input {
      width: 100%;
      padding: 12px 16px 12px 48px;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      background: var(--background-color);
      color: var(--color-text);
      font-size: 16px;
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      &::placeholder {
        color: var(--color-text-secondary);
      }
    }

    .search-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-text-secondary);
      pointer-events: none;
    }
  }

  .filter-controls {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  .filter-select {
    padding: 12px 16px;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background: var(--background-color);
    color: var(--color-text);
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 150px;

    &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    option {
      background: var(--background-color);
      color: var(--color-text);
    }
  }

  .projects-count {
    margin-bottom: 24px;
    padding: 0 8px;

    span {
      color: var(--color-text-secondary);
      font-size: 14px;
      font-weight: 500;
    }
  }
}

.ownership-tabs {
  display: flex;
  gap: 8px;
  margin: 0 0 20px;
  padding: 6px;
  overflow-x: auto;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: var(--background-secondary);
}

.ownership-tab {
  display: inline-flex;
  flex: 1 0 auto;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 46px;
  padding: 10px 18px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--color-text-secondary);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.ownership-tab span {
  display: inline-grid;
  min-width: 24px;
  min-height: 24px;
  place-items: center;
  border-radius: 999px;
  background: var(--background-color);
  font-size: 0.8rem;
}

.ownership-tab:hover,
.ownership-tab:focus-visible {
  border-color: var(--border-color);
  color: var(--color-text);
}

.ownership-tab:focus-visible,
.ownership-panel:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
}

.ownership-tab.active {
  background: var(--background-color);
  color: var(--color-text);
  box-shadow: var(--card-shadow);
}

.ownership-panel { min-width: 0; }

.single-category-title { margin: 0 0 16px; font-size: 1.25rem; }

.category-empty-state,
.unverified-projects {
  margin: 24px 0;
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  color: var(--color-text-secondary);
}

.category-empty-state h2 { margin-top: 0; color: var(--color-text); }

.unverified-projects summary {
  color: var(--color-text);
  font-weight: 650;
  cursor: pointer;
}

.unverified-intro { margin-bottom: 0; }

.unverified-projects[open] .cards { margin-bottom: 0; }

@media (max-width: 520px) {
  .ownership-tabs { gap: 4px; padding: 4px; }
  .ownership-tab { justify-content: flex-start; padding: 10px 12px; font-size: 0.9rem; }
}

// Loading state
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// Error state
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.error-message {
  color: #ef4444;
  font-size: 1.1rem;
  margin-bottom: 24px;
}

.retry-button {
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }
}

// Empty state
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  color: var(--color-text-secondary);

  h3 {
    margin: 0 0 16px 0;
    font-size: 1.5rem;
    color: var(--color-text);
  }

  p {
    margin: 0;
    font-size: 1.1rem;
  }
}

.cta-section {
  text-align: center;
  margin: 64px 0;
  padding: 48px;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.1) 0%,
    rgba(118, 75, 162, 0.1) 100%
  );
  border-radius: 20px;
  border: 1px solid var(--background-info-color);

  h2 {
    margin: 0 0 16px 0;
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text);
  }

  p {
    margin: 0 0 32px 0;
    font-size: 1.1rem;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }
}

.cta-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.cta-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;

  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }
  }

  &.secondary {
    background: var(--background-color);
    color: var(--color-text);
    border: 2px solid var(--background-info-color);

    &:hover {
      border-color: #ef4444;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(239, 68, 68, 0.2);
    }
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }

  h1 {
    font-size: 2rem;
  }

  .cta-section {
    padding: 32px 24px;
    margin: 48px 0;
  }

  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }

  .cta-button {
    width: 100%;
    max-width: 300px;
    justify-content: center;
  }
}
</style>
