<template>
  <div class="interactive-gallery">
    <div class="gallery-header">
      <h2>
        <GradientText variant="primary">Наши работы</GradientText>
      </h2>
      <p>Интерактивная галерея проектов</p>
    </div>

    <!-- Состояние загрузки -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Загрузка проектов...</p>
    </div>

    <!-- Состояние ошибки -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="fetchProjects" class="retry-btn">
        Попробовать снова
      </button>
    </div>

    <!-- Галерея проектов -->
    <div v-else class="gallery-grid">
      <div
        v-for="(project, index) in projects"
        :key="project.id || index"
        class="gallery-item"
        :class="{ active: activeIndex === index }"
        @click="setActiveIndex(index)"
        @mouseenter="setActiveIndex(index)"
      >
        <div
          class="item-image"
          :style="{ backgroundImage: 'url(' + project.image + ')' }"
        >
          <div class="item-overlay">
            <div class="item-content">
              <h3>{{ project.title }}</h3>
              <div class="item-tech">
                <span
                  v-for="tech in project.technologies"
                  :key="tech"
                  class="tech-tag"
                >
                  {{ tech }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import GradientText from "./GradientText.vue";

const activeIndex = ref(0);
const projects = ref([]);
const loading = ref(true);
const error = ref(null);

// Загружаем проекты из базы данных
const fetchProjects = async () => {
  try {
    loading.value = true;
    const response = await $fetch("/api/projects");

    // Фильтруем только избранные проекты и берем максимум 4
    const featuredProjects = response
      .filter((project) => project.featured)
      .slice(0, 6);

    // Если избранных проектов меньше 4, добавляем обычные
    if (featuredProjects.length < 6) {
      const remainingProjects = response
        .filter((project) => !project.featured)
        .slice(0, 6 - featuredProjects.length);
      projects.value = [...featuredProjects, ...remainingProjects];
    } else {
      projects.value = featuredProjects;
    }

    console.log(
      "🔍 InteractiveGallery: Загружено проектов:",
      projects.value.length
    );
  } catch (err) {
    console.error("Ошибка загрузки проектов:", err);
    error.value = "Не удалось загрузить проекты";

    // Fallback на статические данные
    projects.value = [
      {
        title: "K-Studio",
        description: "Корпоративная веб-разработка",
        image: "https://placehold.co/400x300/667eea/ffffff?text=K-Studio",
        technologies: ["Vue.js", "Nuxt.js", "SCSS"],
      },
      {
        title: "Проект 2",
        description: "Веб-приложение",
        image: "https://placehold.co/400x300/f093fb/ffffff?text=Project+2",
        technologies: ["Vue.js", "Node.js", "Prisma"],
      },
      {
        title: "Проект 3",
        description: "Интернет-магазин",
        image: "https://placehold.co/400x300/4facfe/ffffff?text=Project+3",
        technologies: ["Vue.js", "TypeScript", "Docker"],
      },
      {
        title: "Проект 4",
        description: "CRM система",
        image: "https://placehold.co/400x300/fa709a/ffffff?text=Project+4",
        technologies: ["Vue.js", "Nuxt.js", "Prisma", "Docker"],
      },
    ];
  } finally {
    loading.value = false;
  }
};

const setActiveIndex = (index) => {
  activeIndex.value = index;
};

// Загружаем проекты при монтировании компонента
onMounted(() => {
  fetchProjects();
});
</script>

<style lang="scss" scoped>
.interactive-gallery {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 32px;
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(10px);
  animation: slideInUp 0.8s ease-out;
}

.gallery-header {
  text-align: center;
  margin-bottom: 32px;

  h2 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 8px;
  }

  p {
    color: var(--color-text-secondary);
    font-size: 1.1rem;
  }
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.gallery-item {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);

  &:hover {
    transform: translateY(-8px);
    box-shadow: var(--card-shadow-hover);
  }

  &.active {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 16px 40px rgba(102, 126, 234, 0.3);
  }
}

.item-image {
  width: 100%;
  height: 200px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.item-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.9),
    rgba(118, 75, 162, 0.9)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;

  .gallery-item:hover &,
  .gallery-item.active & {
    opacity: 1;
  }
}

.item-content {
  text-align: center;
  color: white;
  padding: 20px;

  h3 {
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 8px;
  }

  p {
    font-size: 1rem;
    margin-bottom: 16px;
    opacity: 0.9;
  }
}

.item-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.tech-tag {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--accent-color);
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

.error-state p {
  color: var(--text-muted);
  margin-bottom: 16px;
  font-size: 1.1rem;
}

.retry-btn {
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
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
}

@media (max-width: 768px) {
  .interactive-gallery {
    padding: 24px;
  }

  .gallery-header h2 {
    font-size: 1.5rem;
  }

  .gallery-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .item-image {
    height: 160px;
  }
}
</style>
