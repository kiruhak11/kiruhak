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

            <!-- Значок завершения -->
            <div v-if="tutorial.isCompleted" class="completed-badge">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <div class="completed-info">
                <span class="completed-text">Пройдено</span>
                <span v-if="tutorial.testScore !== null" class="test-score">
                  Тест: {{ tutorial.testScore }}%
                </span>
              </div>
            </div>

            <div class="tutorial-progress" v-else-if="tutorial.progress">
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

            <button :class="['tutorial-button', { completed: tutorial.isCompleted }]">
              <span v-if="tutorial.isCompleted">✓ Пройдено</span>
              <span v-else-if="tutorial.progress">Продолжить</span>
              <span v-else>Начать туториал</span>
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
              <!-- Индикатор шагов -->
              <div class="steps-indicator" v-if="selectedTutorial.steps && selectedTutorial.steps.length > 0">
                <div class="step-progress">
                  <span class="step-text">
                    Шаг {{ currentStep }} из {{ selectedTutorial.steps.length }}
                  </span>
                  <div class="step-bar">
                    <div
                      class="step-fill"
                      :style="{ width: (currentStep / selectedTutorial.steps.length * 100) + '%' }"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- Контент текущего шага -->
              <div class="tutorial-content" v-if="!showTest">
                <div v-if="currentStepData">
                  <h3>{{ currentStepData.title }}</h3>
                  <div v-html="sanitizedCurrentStepContent"></div>
                </div>
                <div v-else-if="!selectedTutorial.steps || selectedTutorial.steps.length === 0">
                  <p>Контент туториала не загружен. Пожалуйста, попробуйте позже.</p>
                </div>
              </div>

              <!-- Тест -->
              <div class="tutorial-test" v-else>
                <h3>Проверочный тест</h3>
                <p class="test-description">
                  Ответьте на вопросы, чтобы завершить туториал
                </p>

                <div
                  v-for="(question, qIndex) in selectedTutorial.testQuestions"
                  :key="question.id"
                  class="test-question"
                >
                  <p class="question-text">
                    {{ qIndex + 1 }}. {{ question.question }}
                  </p>
                  <div class="question-answers">
                    <label
                      v-for="answer in question.answers"
                      :key="answer.id"
                      class="answer-option"
                    >
                      <input
                        v-if="question.type === 'single'"
                        type="radio"
                        :name="'question-' + question.id"
                        :value="answer.id"
                        v-model="testAnswers[question.id]"
                      />
                      <input
                        v-else-if="question.type === 'multiple'"
                        type="checkbox"
                        :value="answer.id"
                        v-model="testAnswers[question.id]"
                      />
                      <span>{{ answer.answer }}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div class="tutorial-navigation">
                <button
                  v-if="!showTest && currentStep > 1"
                  @click="previousStep"
                  class="nav-button prev"
                >
                  ← Назад
                </button>
                <button
                  v-if="!showTest && selectedTutorial.steps && currentStep < selectedTutorial.steps.length"
                  @click="nextStep"
                  class="nav-button next"
                >
                  Далее →
                </button>
                <button
                  v-else-if="!showTest && selectedTutorial.steps && currentStep === selectedTutorial.steps.length && hasTest"
                  @click="startTest"
                  class="nav-button next"
                >
                  Пройти тест →
                </button>
                <button
                  v-else-if="!showTest && selectedTutorial.steps && currentStep === selectedTutorial.steps.length"
                  @click="completeTutorial"
                  class="nav-button complete"
                >
                  Завершить
                </button>
                <button
                  v-if="showTest"
                  @click="backToSteps"
                  class="nav-button prev"
                >
                  ← К шагам
                </button>
                <button
                  v-if="showTest"
                  @click="submitTest"
                  class="nav-button complete"
                >
                  Завершить туториал
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
import { sanitizeHtml } from "~/util/sanitize-html";

// Фильтры
const selectedDifficulty = ref("");
const selectedCategory = ref("");

// Состояние модалки
const selectedTutorial = ref<Tutorial | null>(null);
const currentStep = ref(1);
const testScore = ref(0);
const showTest = ref(false);
const testAnswers = ref({});

// Инициализация auth
const { user, initAuth, isAuthenticated } = useAuth();

// Computed для текущего шага
const currentStepData = computed(() => {
  if (!selectedTutorial.value || !selectedTutorial.value.steps || selectedTutorial.value.steps.length === 0) {
    return null;
  }
  return selectedTutorial.value.steps[currentStep.value - 1];
});

const sanitizedCurrentStepContent = computed(() =>
  sanitizeHtml(currentStepData.value?.content || "")
);

// Computed для проверки наличия теста
const hasTest = computed(() => {
  return selectedTutorial.value?.testQuestions && selectedTutorial.value.testQuestions.length > 0;
});

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
    const { getAuthHeaders } = useApi();
    
    const response = await $fetch("/api/tutorials", {
      headers: getAuthHeaders(),
    });
    
    if (response.success && "tutorials" in response) {
      tutorials.value = response.tutorials.map((tutorial: any) => ({
        ...tutorial,
        icon: getTutorialIcon(tutorial.category),
        progress: tutorial.progress || 0,
        isCompleted: tutorial.isCompleted || false,
        testScore: tutorial.testScore || null,
      }));
      
      console.log("📚 Загружено туториалов:", tutorials.value.length);
      console.log("✅ Завершенных:", tutorials.value.filter(t => t.isCompleted).length);
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

const openTutorial = async (tutorial: Tutorial) => {
  try {
    const { getAuthHeaders } = useApi();
    
    // Загружаем полные данные туториала с шагами
    const response = await $fetch(`/api/tutorials/${tutorial.id}`, {
      headers: getAuthHeaders(),
    });
    
    if (response.success && response.tutorial) {
      selectedTutorial.value = {
        ...response.tutorial,
        icon: getTutorialIcon(response.tutorial.category),
      };
      currentStep.value = 1;
      console.log("📚 Туториал загружен:", selectedTutorial.value);
      console.log("📝 Количество шагов:", selectedTutorial.value.steps?.length);
    } else {
      alert("Не удалось загрузить туториал");
    }
  } catch (error) {
    console.error("Ошибка загрузки туториала:", error);
    alert("Ошибка загрузки туториала");
  }
};

const closeTutorial = () => {
  selectedTutorial.value = null;
  currentStep.value = 1;
  showTest.value = false;
  testAnswers.value = {};
};

const startTest = () => {
  console.log("🧪 Начало теста");
  showTest.value = true;
  // Инициализируем ответы
  if (selectedTutorial.value?.testQuestions) {
    selectedTutorial.value.testQuestions.forEach((question) => {
      if (question.type === 'multiple') {
        testAnswers.value[question.id] = [];
      } else {
        testAnswers.value[question.id] = null;
      }
    });
  }
};

const backToSteps = () => {
  showTest.value = false;
};

const submitTest = () => {
  // Подсчитываем результат
  if (!selectedTutorial.value?.testQuestions) {
    completeTutorial();
    return;
  }

  let correctAnswers = 0;
  const totalQuestions = selectedTutorial.value.testQuestions.length;

  selectedTutorial.value.testQuestions.forEach((question) => {
    const userAnswer = testAnswers.value[question.id];
    const correctAnswerIds = question.answers
      .filter((a) => a.isCorrect)
      .map((a) => a.id);

    if (question.type === 'single') {
      if (correctAnswerIds.includes(userAnswer)) {
        correctAnswers++;
      }
    } else if (question.type === 'multiple') {
      const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [];
      const isCorrect =
        userAnswerArray.length === correctAnswerIds.length &&
        userAnswerArray.every((id) => correctAnswerIds.includes(id));
      if (isCorrect) {
        correctAnswers++;
      }
    }
  });

  const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
  testScore.value = scorePercentage;

  console.log(`🎯 Результат теста: ${correctAnswers}/${totalQuestions} (${scorePercentage}%)`);

  // Завершаем туториал с результатом теста
  completeTutorial();
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
    console.log("🎯 Попытка завершения туториала");
    console.log("👤 Пользователь:", user.value);
    console.log("🔐 Авторизован:", isAuthenticated.value);

    if (!isAuthenticated.value || !user.value) {
      alert("Необходимо войти в аккаунт для завершения туториала");
      navigateTo('/login');
      return;
    }

    const { getAuthHeaders } = useApi();
    
    const response = await $fetch(
      `/api/tutorials/${selectedTutorial.value.id}/complete`,
      {
        method: "POST",
        headers: getAuthHeaders(),
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
        tutorial.isCompleted = true;
      }

      closeTutorial();
      alert(
        `Поздравляем! Вы завершили туториал${response.reward ? ` и получили ${response.reward} рублей!` : '!'}`
      );
      
      // Перезагружаем туториалы
      await loadTutorials();
    } else {
      alert(response.error || "Ошибка завершения туториала");
    }
  } catch (error) {
    console.error("Ошибка завершения туториала:", error);
    alert("Ошибка завершения туториала. Проверьте консоль для подробностей.");
  }
};

// Иконки (заглушки)
const IconVue = { template: "<div>⚡</div>" };
const IconNuxt = { template: "<div>🟢</div>" };
const IconTypeScript = { template: "<div>🔵</div>" };
const IconPerformance = { template: "<div>⚡</div>" };

// Загружаем туториалы при монтировании
onMounted(async () => {
  await initAuth();
  await loadTutorials();
  console.log("🔐 Состояние авторизации:", {
    isAuthenticated: isAuthenticated.value,
    user: user.value?.firstName,
    isAdmin: user.value?.isAdmin,
  });
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

.completed-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);

  svg {
    flex-shrink: 0;
  }

  .completed-info {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .completed-text {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .test-score {
      font-size: 0.85rem;
      opacity: 0.9;
    }
  }
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

  &.completed {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    
    &:hover {
      box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
    }
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

.steps-indicator {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.step-progress {
  .step-text {
    display: block;
    font-size: 0.9rem;
    color: var(--color-text-secondary);
    margin-bottom: 8px;
    font-weight: 600;
  }

  .step-bar {
    width: 100%;
    height: 6px;
    background: var(--background-color-secondary);
    border-radius: 3px;
    overflow: hidden;
  }

  .step-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-accent), #764ba2);
    transition: width 0.3s ease;
  }
}

.tutorial-content,
.tutorial-test {
  margin-bottom: 32px;
}

.tutorial-content {
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

// Стили для теста
.tutorial-test {
  h3 {
    color: var(--color-text);
    margin-bottom: 12px;
    font-size: 1.5rem;
  }

  .test-description {
    color: var(--color-text-secondary);
    margin-bottom: 32px;
  }
}

.test-question {
  background: var(--background-color-secondary);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid var(--border-color);

  .question-text {
    color: var(--color-text);
    font-weight: 600;
    margin-bottom: 16px;
    font-size: 1.05rem;
    line-height: 1.6;
  }
}

.question-answers {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.answer-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--background-color);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--color-accent);
    background: rgba(102, 126, 234, 0.05);
  }

  input {
    cursor: pointer;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  span {
    color: var(--color-text);
    line-height: 1.5;
  }

  &:has(input:checked) {
    border-color: var(--color-accent);
    background: rgba(102, 126, 234, 0.1);
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
