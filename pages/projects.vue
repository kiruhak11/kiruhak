<template>
  <NuxtLayout>
    <main>
      <div class="container">
        <div class="label">
          <h1>
            <GradientText variant="primary">Проекты</GradientText>
          </h1>
          <p class="subtitle">Корпоративные решения и внедрения для бизнеса</p>
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

        <!-- Projects grid -->
        <div v-else class="projects-container">
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

          <div class="cards">
            <ProjectCard
              v-for="project in filteredProjects"
              :key="project.id"
              :project="project"
              @openModal="openProjectModal"
              @visitProject="visitProject"
            />
          </div>
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
            <GradientText variant="secondary"
              >Нужен сайт для вашего бизнеса?</GradientText
            >
          </h2>
          <p>
            Создам современный и функциональный веб-сайт, который поможет вашему
            бизнесу расти
          </p>
          <div class="cta-buttons">
            <button class="cta-button primary" @click="handleOrderClick">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Заказать сайт
            </button>
            <button class="cta-button secondary" @click="handleDonationClick">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  fill="currentColor"
                />
              </svg>
              Поддержать проект
            </button>
          </div>
        </div>
      </div>
    </main>
  </NuxtLayout>
</template>

<script setup lang="ts">
import GradientText from "~/components/GradientText.vue";
import ProjectModal from "~/components/ProjectModal.vue";
import DonationModal from "~/components/DonationModal.vue";
import OrderModal from "~/components/OrderModal.vue";
import { useProjects } from "~/composables/useProjects";
import { useFrogModal } from "#imports";

const { setModal } = useFrogModal();

// Используем composable для работы с проектами
const { projects, loading, error, fetchProjects } = useProjects();

// Загружаем проекты при монтировании компонента
onMounted(() => {
  fetchProjects();
});

// Фильтрация и поиск
const searchQuery = ref("");
const selectedCategory = ref("");
const sortBy = ref("date");

// Вычисляемые свойства для фильтрации
const availableCategories = computed(() => {
  const categories = new Set(projects.value.map((project) => project.category));
  return Array.from(categories).sort();
});

const filteredProjects = computed(() => {
  let filtered = [...projects.value];

  // Поиск по названию и описанию
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (project) =>
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
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

const visitProject = (project: any) => {
  if (project.liveUrl) {
    window.open(project.liveUrl, "_blank");
  }
};

// Модальные окна
const selectedProject = ref<any>(null);
const openProjectModal = (project: any) => {
  selectedProject.value = project;
};
const closeProjectModal = () => {
  selectedProject.value = null;
};

const handleOrderClick = () => {
  setModal(OrderModal);
};

const handleDonationClick = () => {
  setModal(DonationModal);
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
