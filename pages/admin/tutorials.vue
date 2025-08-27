<template>
  <div class="admin-layout">
    <AdminNavigation />
    <div class="admin-container">
      <div class="header">
        <h1>Управление туториалами</h1>
        <button @click="showCreateModal = true" class="create-button">
          + Добавить туториал
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Загружаем туториалы...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="fetchTutorials">Попробовать снова</button>
      </div>

      <!-- Tutorials list -->
      <div v-else class="tutorials-list">
        <div
          v-for="tutorial in tutorials"
          :key="tutorial.id"
          class="tutorial-item"
        >
          <div class="tutorial-info">
            <div class="tutorial-icon">
              <span class="icon">{{ getTutorialIcon(tutorial.category) }}</span>
            </div>
            <div class="tutorial-details">
              <h3>{{ tutorial.title }}</h3>
              <p>{{ tutorial.description }}</p>
              <div class="tutorial-meta">
                <span class="difficulty">{{
                  getDifficultyText(tutorial.difficulty)
                }}</span>
                <span class="category">{{ tutorial.category }}</span>
                <span class="duration">{{ tutorial.duration }}</span>
                <span v-if="tutorial.isActive" class="status active"
                  >Активен</span
                >
                <span v-else class="status inactive">Неактивен</span>
              </div>
              <div class="tutorial-stats">
                <span>{{ tutorial.steps?.length || 0 }} шагов</span>
                <span
                  >{{ tutorial.userProgress?.length || 0 }} прохождений</span
                >
              </div>
            </div>
          </div>
          <div class="tutorial-actions">
            <button @click="editTutorial(tutorial)" class="edit-button">
              ✏️ Редактировать
            </button>
            <button
              @click="handleDeleteTutorial(tutorial.id)"
              class="delete-button"
            >
              🗑️ Удалить
            </button>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div
        v-if="showCreateModal || showEditModal"
        class="modal-overlay"
        @click="closeModal"
      >
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>
              {{
                showEditModal ? "Редактировать туториал" : "Создать туториал"
              }}
            </h2>
            <button @click="closeModal" class="close-button">×</button>
          </div>

          <form @submit.prevent="submitTutorial" class="tutorial-form">
            <div class="form-group">
              <label>Название *</label>
              <input v-model="form.title" type="text" required />
            </div>

            <div class="form-group">
              <label>Описание *</label>
              <textarea v-model="form.description" rows="3" required></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Сложность *</label>
                <select v-model="form.difficulty" required>
                  <option value="beginner">Начинающий</option>
                  <option value="intermediate">Средний</option>
                  <option value="advanced">Продвинутый</option>
                </select>
              </div>

              <div class="form-group">
                <label>Категория *</label>
                <select v-model="form.category" required>
                  <option value="vue">Vue.js</option>
                  <option value="nuxt">Nuxt.js</option>
                  <option value="typescript">TypeScript</option>
                  <option value="performance">Производительность</option>
                </select>
              </div>

              <div class="form-group">
                <label>Длительность *</label>
                <input
                  v-model="form.duration"
                  type="text"
                  placeholder="15 мин"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label>Особенности (через запятую)</label>
              <input
                v-model="featuresInput"
                type="text"
                placeholder="Реактивность, Lifecycle, Composables"
              />
            </div>

            <div class="form-group">
              <label>Порядок отображения</label>
              <input v-model="form.order" type="number" min="0" />
            </div>

            <div class="form-group checkbox">
              <label>
                <input v-model="form.isActive" type="checkbox" />
                Активен
              </label>
            </div>

            <div class="form-group">
              <label>Шаги туториала</label>
              <div class="steps-container">
                <div
                  v-for="(step, index) in form.steps"
                  :key="index"
                  class="step-item"
                >
                  <div class="step-header">
                    <span>Шаг {{ index + 1 }}</span>
                    <button
                      @click="removeStep(index)"
                      type="button"
                      class="remove-step"
                    >
                      ×
                    </button>
                  </div>
                  <input v-model="step.title" placeholder="Название шага" />
                  <textarea
                    v-model="step.content"
                    placeholder="HTML контент шага"
                    rows="4"
                  ></textarea>
                </div>
                <button @click="addStep" type="button" class="add-step">
                  + Добавить шаг
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Тест</label>
              <div class="test-container">
                <div
                  v-for="(question, qIndex) in form.testQuestions"
                  :key="qIndex"
                  class="question-item"
                >
                  <div class="question-header">
                    <span>Вопрос {{ qIndex + 1 }}</span>
                    <button
                      @click="removeQuestion(qIndex)"
                      type="button"
                      class="remove-question"
                    >
                      ×
                    </button>
                  </div>

                  <textarea
                    v-model="question.question"
                    placeholder="Текст вопроса"
                    rows="3"
                  ></textarea>

                  <select v-model="question.type" class="question-type">
                    <option value="single">Один правильный ответ</option>
                    <option value="multiple">
                      Несколько правильных ответов
                    </option>
                    <option value="text">Текстовый ответ</option>
                  </select>

                  <div
                    v-if="question.type !== 'text'"
                    class="answers-container"
                  >
                    <div
                      v-for="(answer, aIndex) in question.answers"
                      :key="aIndex"
                      class="answer-item"
                    >
                      <input
                        v-model="answer.answer"
                        placeholder="Вариант ответа"
                        class="answer-input"
                      />
                      <label class="answer-checkbox">
                        <input
                          v-model="answer.isCorrect"
                          type="checkbox"
                          :disabled="
                            question.type === 'single' &&
                            getCorrectAnswersCount(question) === 1 &&
                            answer.isCorrect
                          "
                        />
                        Правильный
                      </label>
                      <button
                        @click="removeAnswer(qIndex, aIndex)"
                        type="button"
                        class="remove-answer"
                      >
                        ×
                      </button>
                    </div>
                    <button
                      @click="addAnswer(qIndex)"
                      type="button"
                      class="add-answer"
                    >
                      + Добавить ответ
                    </button>
                  </div>
                </div>
                <button @click="addQuestion" type="button" class="add-question">
                  + Добавить вопрос
                </button>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeModal" class="cancel-button">
                Отмена
              </button>
              <button
                type="submit"
                :disabled="submitting"
                class="submit-button"
              >
                {{
                  submitting
                    ? "Сохранение..."
                    : showEditModal
                    ? "Обновить"
                    : "Создать"
                }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

// State
const tutorials = ref([]);
const loading = ref(true);
const error = ref(null);
const submitting = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const editingTutorial = ref(null);

// Form
const form = ref({
  title: "",
  description: "",
  difficulty: "beginner",
  category: "vue",
  duration: "",
  features: [],
  order: 0,
  isActive: true,
  steps: [],
  testQuestions: [],
});

// Computed
const featuresInput = computed({
  get: () => form.value.features.join(", "),
  set: (value) => {
    form.value.features = value
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f);
  },
});

// Methods
const fetchTutorials = async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await apiFetch("/api/tutorials");
    if (response.success) {
      tutorials.value = response.tutorials;
    } else {
      error.value = response.error || "Ошибка загрузки туториалов";
    }
  } catch (err) {
    console.error("Ошибка загрузки туториалов:", err);
    error.value = "Ошибка загрузки туториалов";
  } finally {
    loading.value = false;
  }
};

const getDifficultyText = (difficulty) => {
  const texts = {
    beginner: "Начинающий",
    intermediate: "Средний",
    advanced: "Продвинутый",
  };
  return texts[difficulty] || difficulty;
};

const getTutorialIcon = (category) => {
  const icons = {
    vue: "⚡",
    nuxt: "🟢",
    typescript: "🔵",
    performance: "⚡",
  };
  return icons[category] || "📚";
};

const editTutorial = (tutorial) => {
  editingTutorial.value = tutorial;
  form.value = {
    title: tutorial.title,
    description: tutorial.description,
    difficulty: tutorial.difficulty,
    category: tutorial.category,
    duration: tutorial.duration,
    features: tutorial.features || [],
    order: tutorial.order,
    isActive: tutorial.isActive,
    steps:
      tutorial.steps?.map((step) => ({
        title: step.title,
        content: step.content,
      })) || [],
    testQuestions:
      tutorial.testQuestions?.map((question) => ({
        question: question.question,
        type: question.type,
        order: question.order,
        answers:
          question.answers?.map((answer) => ({
            answer: answer.answer,
            isCorrect: answer.isCorrect,
            order: answer.order,
          })) || [],
      })) || [],
  };
  showEditModal.value = true;
};

const closeModal = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  editingTutorial.value = null;
  resetForm();
};

const resetForm = () => {
  form.value = {
    title: "",
    description: "",
    difficulty: "beginner",
    category: "vue",
    duration: "",
    features: [],
    order: 0,
    isActive: true,
    steps: [],
    testQuestions: [],
  };
};

const addStep = () => {
  form.value.steps.push({
    title: "",
    content: "",
  });
};

const removeStep = (index) => {
  form.value.steps.splice(index, 1);
};

// Управление вопросами
const addQuestion = () => {
  form.value.testQuestions.push({
    question: "",
    type: "single",
    order: form.value.testQuestions.length + 1,
    answers: [],
  });
};

const removeQuestion = (index) => {
  form.value.testQuestions.splice(index, 1);
  // Обновляем порядок
  form.value.testQuestions.forEach((question, i) => {
    question.order = i + 1;
  });
};

// Управление ответами
const addAnswer = (questionIndex) => {
  form.value.testQuestions[questionIndex].answers.push({
    answer: "",
    isCorrect: false,
    order: form.value.testQuestions[questionIndex].answers.length + 1,
  });
};

const removeAnswer = (questionIndex, answerIndex) => {
  form.value.testQuestions[questionIndex].answers.splice(answerIndex, 1);
  // Обновляем порядок
  form.value.testQuestions[questionIndex].answers.forEach((answer, i) => {
    answer.order = i + 1;
  });
};

// Подсчет правильных ответов
const getCorrectAnswersCount = (question) => {
  return question.answers.filter((answer) => answer.isCorrect).length;
};

const { apiFetch } = useApi();

const submitTutorial = async () => {
  try {
    submitting.value = true;

    const tutorialData = {
      ...form.value,
    };

    if (editingTutorial.value) {
      await apiFetch(`/api/tutorials/${editingTutorial.value.id}`, {
        method: "PUT",
        body: tutorialData,
      });
    } else {
      await apiFetch("/api/tutorials", {
        method: "POST",
        body: tutorialData,
      });
    }

    closeModal();
    await fetchTutorials();
  } catch (err) {
    console.error("Ошибка сохранения туториала:", err);
    alert("Ошибка сохранения туториала");
  } finally {
    submitting.value = false;
  }
};

const handleDeleteTutorial = async (id) => {
  if (!confirm("Вы уверены, что хотите удалить этот туториал?")) {
    return;
  }

  try {
    await apiFetch(`/api/tutorials/${id}`, {
      method: "DELETE",
    });
    await fetchTutorials();
  } catch (err) {
    console.error("Ошибка удаления туториала:", err);
    alert("Ошибка удаления туториала");
  }
};

// Lifecycle
onMounted(() => {
  fetchTutorials();
});
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.admin-container {
  flex: 1;
  margin-left: 250px;
  padding: 2rem;
  background: var(--background-color);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--color-text);
}

.create-button {
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
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }
}

.loading {
  text-align: center;
  padding: 4rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error {
  text-align: center;
  padding: 2rem;
  color: #ef4444;
}

.tutorials-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tutorial-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--color-accent);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.tutorial-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.tutorial-icon {
  width: 60px;
  height: 60px;
  background: var(--gradient-primary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.tutorial-details h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.tutorial-details p {
  margin: 0 0 0.5rem 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.tutorial-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.difficulty,
.category,
.duration,
.status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.difficulty {
  background: #3b82f6;
  color: white;
}

.category {
  background: #10b981;
  color: white;
}

.duration {
  background: #f59e0b;
  color: white;
}

.status.active {
  background: #10b981;
  color: white;
}

.status.inactive {
  background: #ef4444;
  color: white;
}

.tutorial-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.tutorial-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-button,
.delete-button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.edit-button {
  background: #3b82f6;
  color: white;
}

.delete-button {
  background: #ef4444;
  color: white;
}

.edit-button:hover,
.delete-button:hover {
  transform: translateY(-1px);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: var(--background-color);
  border-radius: 12px;
  padding: 2rem;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text-secondary);
}

.tutorial-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: var(--color-text);
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--background-color);
  color: var(--color-text);
}

.form-group.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.form-group.checkbox input {
  width: auto;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.steps-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  background: var(--background-secondary);
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.remove-step {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-step {
  background: #10b981;
  color: white;
  border: 1px dashed #10b981;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: #059669;
  }
}

// Стили для тестов
.test-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  background: var(--background-secondary);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.remove-question {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.question-type {
  margin: 0.5rem 0;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--background-color);
  color: var(--color-text);
}

.answers-container {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.answer-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.answer-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--background-color);
  color: var(--color-text);
}

.answer-checkbox {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  white-space: nowrap;
}

.answer-checkbox input {
  width: auto;
  margin: 0;
}

.remove-answer {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-answer {
  background: #3b82f6;
  color: white;
  border: 1px dashed #3b82f6;
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: #2563eb;
  }
}

.add-question {
  background: #10b981;
  color: white;
  border: 1px dashed #10b981;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: #059669;
  }
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.cancel-button,
.submit-button {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.cancel-button {
  background: var(--background-secondary);
  color: var(--color-text);
}

.submit-button {
  background: var(--gradient-primary);
  color: white;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }

  .admin-container {
    margin-left: 0;
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .tutorial-item {
    flex-direction: column;
    gap: 1rem;
  }

  .tutorial-actions {
    width: 100%;
    justify-content: center;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
