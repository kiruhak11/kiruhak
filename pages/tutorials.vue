<template>
  <NuxtLayout>
    <main class="tutorials-page">
      <div class="container">
        <!-- Заголовок страницы -->
        <div class="header-section">
          <h1 class="main-title">
            <GradientText variant="secondary">Туториалы по Vue.js</GradientText>
          </h1>
          <p class="subtitle">
            Пошаговые руководства для изучения Vue.js и Nuxt.js
          </p>
        </div>

        <!-- Фильтры -->
        <div class="filters-section">
          <div class="filter-group">
            <label>Сложность:</label>
            <select v-model="selectedDifficulty" class="filter-select">
              <option value="">Все уровни</option>
              <option value="beginner">Начинающий</option>
              <option value="intermediate">Средний</option>
              <option value="advanced">Продвинутый</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Категория:</label>
            <select v-model="selectedCategory" class="filter-select">
              <option value="">Все категории</option>
              <option value="vue">Vue.js</option>
              <option value="nuxt">Nuxt.js</option>
              <option value="typescript">TypeScript</option>
              <option value="performance">Производительность</option>
            </select>
          </div>
        </div>

        <!-- Список туториалов -->
        <div class="tutorials-grid">
          <div
            v-for="tutorial in filteredTutorials"
            :key="tutorial.id"
            class="tutorial-card"
            @click="openTutorial(tutorial)"
          >
            <div class="tutorial-header">
              <div class="tutorial-icon">
                <component :is="tutorial.icon" />
              </div>
              <div class="tutorial-meta">
                <span :class="['difficulty', tutorial.difficulty]">
                  {{ getDifficultyText(tutorial.difficulty) }}
                </span>
                <span class="duration">{{ tutorial.duration }}</span>
              </div>
            </div>

            <h3 class="tutorial-title">{{ tutorial.title }}</h3>
            <p class="tutorial-description">{{ tutorial.description }}</p>

            <div class="tutorial-features">
              <span
                v-for="feature in tutorial.features"
                :key="feature"
                class="feature"
              >
                {{ feature }}
              </span>
            </div>

            <div class="tutorial-progress" v-if="tutorial.progress">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: tutorial.progress + '%' }"
                ></div>
              </div>
              <span class="progress-text"
                >{{ tutorial.progress }}% завершено</span
              >
            </div>

            <button class="tutorial-button">
              {{ tutorial.progress ? "Продолжить" : "Начать туториал" }}
            </button>
          </div>
        </div>

        <!-- Модалка туториала -->
        <div
          v-if="selectedTutorial"
          class="tutorial-modal"
          @click="closeTutorial"
        >
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h2>{{ selectedTutorial.title }}</h2>
              <button @click="closeTutorial" class="close-button">×</button>
            </div>

            <div class="modal-body">
              <div class="tutorial-content">
                <div v-html="selectedTutorial.content"></div>
              </div>

              <div class="tutorial-navigation">
                <button
                  v-if="currentStep > 1"
                  @click="previousStep"
                  class="nav-button prev"
                >
                  ← Назад
                </button>
                <button
                  v-if="currentStep < selectedTutorial.steps.length"
                  @click="nextStep"
                  class="nav-button next"
                >
                  Далее →
                </button>
                <button
                  v-else
                  @click="completeTutorial"
                  class="nav-button complete"
                >
                  Завершить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import GradientText from "~/components/GradientText.vue";

// Фильтры
const selectedDifficulty = ref("");
const selectedCategory = ref("");

// Состояние модалки
const selectedTutorial = ref<Tutorial | null>(null);
const currentStep = ref(1);
const testScore = ref(0);
const showTest = ref(false);
const testAnswers = ref({});

// Типы
interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  duration: string;
  features: string[];
  progress: number;
  isCompleted: boolean;
  testScore: number | null;
  steps: any[];
  icon: string;
}

// Данные туториалов
const tutorials = ref<Tutorial[]>([]);
const loading = ref(true);

// Загрузка туториалов с сервера
const loadTutorials = async () => {
  try {
    loading.value = true;
    const response = await $fetch("/api/tutorials");
    if (response.success && "tutorials" in response) {
      tutorials.value = response.tutorials.map((tutorial: any) => ({
        ...tutorial,
        icon: getTutorialIcon(tutorial.category),
      }));
    }
  } catch (error) {
    console.error("Ошибка загрузки туториалов:", error);
  } finally {
    loading.value = false;
  }
};

// Получение иконки для туториала
const getTutorialIcon = (category: string) => {
  const icons: Record<string, string> = {
    vue: "IconVue",
    nuxt: "IconNuxt",
    typescript: "IconTypeScript",
    performance: "IconPerformance",
  };
  return icons[category] || "IconVue";
};

// Фильтрация туториалов
const filteredTutorials = computed(() => {
  return tutorials.value.filter((tutorial: Tutorial) => {
    const difficultyMatch =
      !selectedDifficulty.value ||
      tutorial.difficulty === selectedDifficulty.value;
    const categoryMatch =
      !selectedCategory.value || tutorial.category === selectedCategory.value;
    return difficultyMatch && categoryMatch;
  });
});

// Методы
const getDifficultyText = (difficulty: string) => {
  const texts: Record<string, string> = {
    beginner: "Начинающий",
    intermediate: "Средний",
    advanced: "Продвинутый",
  };
  return texts[difficulty] || difficulty;
};

const openTutorial = (tutorial: Tutorial) => {
  selectedTutorial.value = tutorial;
  currentStep.value = 1;
};

const closeTutorial = () => {
  selectedTutorial.value = null;
  currentStep.value = 1;
};

const nextStep = () => {
  if (
    selectedTutorial.value &&
    currentStep.value < selectedTutorial.value.steps.length
  ) {
    currentStep.value++;
  }
};

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const completeTutorial = async () => {
  try {
    const { user } = useAuth();

    if (!user.value) {
      alert("Необходимо войти в аккаунт для завершения туториала");
      return;
    }

    const response = await $fetch(
      `/api/tutorials/${selectedTutorial.value.id}/complete`,
      {
        method: "POST",
        body: {
          userId: user.value.id,
          testScore: testScore.value,
        },
      }
    );

    if (response.success) {
      // Обновляем прогресс
      const tutorial = tutorials.value.find(
        (t) => t.id === selectedTutorial.value.id
      );
      if (tutorial) {
        tutorial.progress = 100;
      }

      closeTutorial();
      alert(
        `Поздравляем! Вы завершили туториал и получили ${response.reward} рублей!`
      );
    } else {
      alert(response.error || "Ошибка завершения туториала");
    }
  } catch (error) {
    console.error("Ошибка завершения туториала:", error);
    alert("Ошибка завершения туториала");
  }
};

// Иконки (заглушки)
const IconVue = { template: "<div>⚡</div>" };
const IconNuxt = { template: "<div>🟢</div>" };
const IconTypeScript = { template: "<div>🔵</div>" };
const IconPerformance = { template: "<div>⚡</div>" };

// Загружаем туториалы при монтировании
onMounted(() => {
  loadTutorials();
});
</script>

<style lang="scss" scoped>
.tutorials-page {
  min-height: 100vh;
  padding: 32px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
}

.header-section {
  text-align: center;
  margin-bottom: 48px;

  .main-title {
    font-size: 3rem;
    font-weight: 700;
    margin: 0 0 16px 0;
  }

  .subtitle {
    font-size: 1.2rem;
    color: var(--color-text-secondary);
    margin: 0;
  }
}

.filters-section {
  display: flex;
  gap: 24px;
  margin-bottom: 48px;
  justify-content: center;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;

  label {
    font-weight: 600;
    color: var(--color-text);
  }
}

.filter-select {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--background-color);
  color: var(--color-text);
  font-size: 1rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: var(--color-accent);
  }
}

.tutorials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.tutorial-card {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: var(--card-shadow);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--card-shadow-hover);
    border-color: var(--color-accent);
  }
}

.tutorial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tutorial-icon {
  font-size: 2rem;
  color: var(--color-accent);
}

.tutorial-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.difficulty {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;

  &.beginner {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
  }

  &.intermediate {
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
  }

  &.advanced {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
}

.duration {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.tutorial-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: var(--color-text);
}

.tutorial-description {
  color: var(--color-text-secondary);
  margin: 0 0 16px 0;
  line-height: 1.6;
}

.tutorial-features {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.feature {
  background: rgba(102, 126, 234, 0.1);
  color: var(--color-accent);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.tutorial-progress {
  margin-bottom: 20px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--background-color-secondary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent), #764ba2);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.tutorial-button {
  background: var(--color-accent);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }
}

// Модалка
.tutorial-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--background-color);
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid var(--border-color);

  h2 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--color-text);
  }
}

.close-button {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 2rem;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: var(--background-color-secondary);
    color: var(--color-text);
  }
}

.modal-body {
  padding: 32px;
}

.tutorial-content {
  margin-bottom: 32px;

  h3 {
    color: var(--color-text);
    margin-bottom: 16px;
  }

  h4 {
    color: var(--color-text);
    margin: 24px 0 12px 0;
  }

  p {
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin-bottom: 16px;
  }

  ul {
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin-bottom: 16px;
    padding-left: 20px;
  }

  li {
    margin-bottom: 8px;
  }

  strong {
    color: var(--color-text);
  }
}

.code-example {
  background: var(--background-color-secondary);
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;

  h4 {
    margin: 0 0 12px 0;
    color: var(--color-text);
  }

  pre {
    margin: 0;
    overflow-x: auto;
  }

  code {
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
    font-size: 0.9rem;
    line-height: 1.5;
  }
}

.tutorial-navigation {
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.nav-button {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;

  &.prev {
    background: var(--background-color-secondary);
    color: var(--color-text);

    &:hover {
      background: var(--border-color);
    }
  }

  &.next {
    background: var(--color-accent);
    color: white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
  }

  &.complete {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
    }
  }
}

// Адаптивность
@media (max-width: 768px) {
  .header-section .main-title {
    font-size: 2rem;
  }

  .filters-section {
    flex-direction: column;
    align-items: center;
  }

  .tutorials-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    margin: 10px;
    max-height: 95vh;
  }

  .modal-body {
    padding: 20px;
  }

  .tutorial-navigation {
    flex-direction: column;
  }
}
</style>
