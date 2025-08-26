<template>
  <NuxtLayout>
    <main>
      <div class="container">
        <!-- Hero Section -->
        <div class="hero-section">
          <Typewriter
            text="K-Studio — корпоративная веб‑разработка"
            :speed="60"
            :delay="200"
          />
          <p class="hero-subtitle">
            Проектирование, разработка и поддержка сайтов и веб‑сервисов
          </p>
          <div class="hero-buttons">
            <button class="hero-button primary" @click="setModal(OrderModal)">
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
            <button
              class="hero-button secondary"
              @click="setModal(DonationModal)"
            >
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

        <!-- Discount Section -->
        <div v-if="!hasSubmittedDiscount" class="discount-section">
          <h2 class="section-title">Специальное предложение</h2>
          <p class="section-description">
            Получите скидку 15% на разработку первого сайта
          </p>
          <DiscountWheel @show-discount="handleShowDiscount" />
        </div>

        <!-- About Me Section -->
        <AboutMe
          @openOrderModal="setModal(OrderModal)"
          @openDonationModal="setModal(DonationModal)"
        />

        <!-- Projects Section -->
        <div class="projects-section">
          <div class="section-header">
            <h2 class="section-title">
              <GradientText variant="secondary">Мои проекты</GradientText>
            </h2>
            <p class="section-description">
              Посмотрите на мои последние работы и корпоративные решения
            </p>
          </div>

          <!-- Loading state -->
          <div v-if="projectsLoading" class="loading-container">
            <div class="loading-spinner"></div>
            <p>Загружаем проекты...</p>
          </div>

          <!-- Error state -->
          <div v-else-if="projectsError" class="error-container">
            <p class="error-message">{{ projectsError }}</p>
            <button @click="fetchProjects" class="retry-button">
              Попробовать снова
            </button>
          </div>

          <!-- Projects grid -->
          <div v-else-if="projects.length > 0" class="projects-grid">
            <ProjectCard
              v-for="project in projects.slice(0, 6)"
              :key="project.id"
              :project="project"
              @openModal="openProjectModal"
              @visitProject="visitProject"
            />
          </div>

          <!-- Project Modal -->
          <ProjectModal
            v-if="selectedProject"
            :project="selectedProject"
            @close="closeProjectModal"
          />

          <!-- Empty state -->
          <div v-else class="empty-state">
            <h3>Проекты не найдены</h3>
            <p>Пока нет доступных проектов</p>
          </div>

          <!-- View All Projects Button -->
          <div v-if="projects.length > 0" class="view-all-container">
            <NuxtLink to="/projects" class="view-all-button">
              <span>Посмотреть все проекты</span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 12H19"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M12 5L19 12L12 19"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </NuxtLink>
          </div>
        </div>

        <!-- Centered Stats Section -->
        <div class="stats-container">
          <StatsSection />
        </div>

        <!-- Interactive Components -->
        <div class="interactive-section">
          <FocusChecker />
        </div>

        <div class="interactive-section">
          <InteractiveGallery />
        </div>

        <div class="interactive-section">
          <ParallaxSection />
        </div>

        <div class="interactive-section">
          <PhysicalBox />
        </div>

        <!-- Floating Cards -->
        <FloatingCards />

        <!-- Modals -->
        <DiscountContactModal
          :show="showDiscountModal"
          :discount="currentDiscount"
          @close="showDiscountModal = false"
          @submit="handleDiscountSubmit"
        />
      </div>
    </main>
  </NuxtLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Typewriter from "~/components/Typewriter.vue";
import AboutMe from "~/components/AboutMe.vue";
import StatsSection from "~/components/StatsSection.vue";
import FloatingCards from "~/components/FloatingCards.vue";
import FocusChecker from "~/components/FocusChecker.vue";
import InteractiveGallery from "~/components/InteractiveGallery.vue";
import ParallaxSection from "~/components/ParallaxSection.vue";
import PhysicalBox from "~/components/PhysicalBox.vue";
import OrderModal from "~/components/OrderModal.vue";
import DonationModal from "~/components/DonationModal.vue";
import ProjectModal from "~/components/ProjectModal.vue";
import ProjectCard from "~/components/ProjectCard.vue";
import DiscountWheel from "~/components/DiscountWheel.vue";
import DiscountContactModal from "~/components/DiscountContactModal.vue";
import { useFrogModal } from "~/composables/useFrogModal";
import { useProjects } from "~/composables/useProjects";

const { setModal } = useFrogModal();
const {
  projects,
  loading: projectsLoading,
  error: projectsError,
  fetchProjects,
} = useProjects();
const showDiscountModal = ref(false);
const currentDiscount = ref("15%");
const hasSubmittedDiscount = ref(false);

const handleShowDiscount = (discount) => {
  currentDiscount.value = discount;
  showDiscountModal.value = true;
};

const handleDiscountSubmit = () => {
  showDiscountModal.value = false;
  hasSubmittedDiscount.value = true;
  localStorage.setItem("discount_submitted", "true");
  // Можно добавить уведомление об успешной отправке
};

const visitProject = (project) => {
  if (project.liveUrl) {
    window.open(project.liveUrl, "_blank");
  }
};

// Модальные окна
const selectedProject = ref(null);
const openProjectModal = (project) => {
  selectedProject.value = project;
};
const closeProjectModal = () => {
  selectedProject.value = null;
};

onMounted(() => {
  // Проверяем, была ли уже отправлена заявка
  const submitted = localStorage.getItem("discount_submitted");
  if (submitted === "true") {
    hasSubmittedDiscount.value = true;
  }

  // Загружаем проекты
  fetchProjects();
});
</script>

<style lang="scss" scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
}

.hero-section {
  text-align: center;
  padding: 80px 0 60px;

  .hero-subtitle {
    font-size: 1.3rem;
    color: var(--color-text-secondary);
    margin: 24px 0 40px 0;
    line-height: 1.6;
    animation: fadeInUp 0.8s ease forwards 0.6s;
    opacity: 0;
  }
}

.discount-section {
  text-align: center;
  padding: 40px 0;
  margin: 40px 0;
  background: var(--background-secondary);
  border-radius: 20px;

  .section-title {
    font-size: 2rem;
    margin-bottom: 1rem;
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .section-description {
    color: var(--color-text-secondary);
    margin-bottom: 1rem;
  }
}

.hero-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
  animation: fadeInUp 0.8s ease forwards 0.8s;
  opacity: 0;
}

.hero-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 28px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;

  &.primary {
    background: var(--gradient-primary);
    color: white;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }
  }

  &.secondary {
    background: var(--background-color);
    color: var(--color-text);
    border: 2px solid var(--border-color);

    &:hover {
      border-color: #ef4444;
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(239, 68, 68, 0.2);
    }
  }
}

.stats-container {
  display: flex;
  justify-content: center;
  margin: 60px 0;
}

.interactive-section {
  margin: 60px 0;

  &:first-of-type {
    margin-top: 40px;
  }

  &:last-of-type {
    margin-bottom: 40px;
  }
}

// Projects Section
.projects-section {
  margin: 80px 0;
  padding: 60px 0;
  background: var(--background-secondary);
  border-radius: 24px;
  border: 1px solid var(--border-color);
}

.section-header {
  text-align: center;
  margin-bottom: 48px;
  padding: 0 32px;

  .section-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 16px 0;
    line-height: 1.2;
  }

  .section-description {
    color: var(--color-text-secondary);
    font-size: 1.1rem;
    line-height: 1.6;
    margin: 0;
    max-width: 600px;
    margin: 0 auto;
  }
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  padding: 0 32px;
  margin-bottom: 48px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 0 16px;
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

.view-all-container {
  display: flex;
  justify-content: center;
  padding: 0 32px;
}

.view-all-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
  background: var(--gradient-primary);
  color: white;
  text-decoration: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }

  svg {
    transition: transform 0.3s ease;
  }

  &:hover svg {
    transform: translateX(4px);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }

  .hero-section {
    padding: 60px 0 40px;

    .hero-subtitle {
      font-size: 1.1rem;
      margin: 20px 0 30px 0;
    }
  }

  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }

  .hero-button {
    width: 100%;
    max-width: 300px;
    justify-content: center;
  }

  .stats-container {
    margin: 40px 0;
  }

  .interactive-section {
    margin: 40px 0;
  }

  .discount-section {
    margin: 20px 0;
    padding: 30px 16px;

    .section-title {
      font-size: 1.5rem;
    }

    .chances-info {
      .chances-grid {
        gap: 6px;

        .chance-item {
          font-size: 0.75rem;
          padding: 4px 8px;
          min-width: 100px;
        }
      }
    }
  }
}
</style>
