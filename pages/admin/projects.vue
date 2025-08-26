<template>
  <div class="admin-container">
    <div class="header">
      <h1>Управление проектами</h1>
      <button @click="showCreateModal = true" class="create-button">
        + Добавить проект
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загружаем проекты...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="fetchProjects">Попробовать снова</button>
    </div>

    <!-- Projects list -->
    <div v-else class="projects-list">
      <div v-for="project in projects" :key="project.id" class="project-item">
        <div class="project-info">
          <img
            :src="project.image"
            :alt="project.title"
            class="project-image"
          />
          <div class="project-details">
            <h3>{{ project.title }}</h3>
            <p>{{ project.shortDescription }}</p>
            <div class="project-meta">
              <span class="category">{{ project.category }}</span>
              <span v-if="project.featured" class="featured">⭐ Избранный</span>
            </div>
          </div>
        </div>
        <div class="project-actions">
          <button @click="editProject(project)" class="edit-button">
            ✏️ Редактировать
          </button>
          <button @click="handleDeleteProject(project.id)" class="delete-button">
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
            {{ showEditModal ? "Редактировать проект" : "Создать проект" }}
          </h2>
          <button @click="closeModal" class="close-button">×</button>
        </div>

        <form @submit.prevent="submitProject" class="project-form">
          <div class="form-group">
            <label>Название проекта *</label>
            <input v-model="form.title" type="text" required />
          </div>

          <div class="form-group">
            <label>Краткое описание *</label>
            <input v-model="form.shortDescription" type="text" required />
          </div>

          <div class="form-group">
            <label>Полное описание *</label>
            <textarea v-model="form.description" rows="4" required></textarea>
          </div>

          <div class="form-group">
            <label>Изображение (URL) *</label>
            <input v-model="form.image" type="url" required />
          </div>

          <div class="form-group">
            <label>Категория *</label>
            <input v-model="form.category" type="text" required />
          </div>

          <div class="form-group">
            <label>Клиент</label>
            <input v-model="form.client" type="text" />
          </div>

          <div class="form-group">
            <label>Длительность</label>
            <input v-model="form.duration" type="text" />
          </div>

          <div class="form-group">
            <label>Бюджет</label>
            <input v-model="form.budget" type="text" />
          </div>

          <div class="form-group">
            <label>Технологии (через запятую)</label>
            <input
              v-model="technologiesInput"
              type="text"
              placeholder="Vue.js, Nuxt, TypeScript"
            />
          </div>

          <div class="form-group">
            <label>Функции (через запятую)</label>
            <input
              v-model="featuresInput"
              type="text"
              placeholder="Каталог, Корзина, Аналитика"
            />
          </div>

          <div class="form-group">
            <label>Вызовы</label>
            <textarea v-model="form.challenges" rows="3"></textarea>
          </div>

          <div class="form-group">
            <label>Решения</label>
            <textarea v-model="form.solutions" rows="3"></textarea>
          </div>

          <div class="form-group">
            <label>Результаты</label>
            <textarea v-model="form.results" rows="3"></textarea>
          </div>

          <div class="form-group">
            <label>Ссылка на сайт</label>
            <input v-model="form.liveUrl" type="url" />
          </div>

          <div class="form-group">
            <label>Ссылка на GitHub</label>
            <input v-model="form.githubUrl" type="url" />
          </div>

          <div class="form-group checkbox">
            <label>
              <input v-model="form.featured" type="checkbox" />
              Избранный проект
            </label>
          </div>

          <div class="form-group">
            <label>Порядок отображения</label>
            <input v-model="form.order" type="number" min="0" />
          </div>

          <div class="form-actions">
            <button type="button" @click="closeModal" class="cancel-button">
              Отмена
            </button>
            <button type="submit" :disabled="submitting" class="submit-button">
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
</template>

<script setup>
const {
  projects,
  loading,
  error,
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
} = useProjects();

const showCreateModal = ref(false);
const showEditModal = ref(false);
const submitting = ref(false);
const editingProject = ref(null);

const form = ref({
  title: "",
  shortDescription: "",
  description: "",
  image: "",
  category: "",
  client: "",
  duration: "",
  budget: "",
  technologies: [],
  features: [],
  challenges: "",
  solutions: "",
  results: "",
  liveUrl: "",
  githubUrl: "",
  featured: false,
  order: 0,
});

const technologiesInput = ref("");
const featuresInput = ref("");

// Загружаем проекты при монтировании
onMounted(() => {
  fetchProjects();
});

const editProject = (project) => {
  editingProject.value = project;
  form.value = { ...project };
  technologiesInput.value = project.technologies?.join(", ") || "";
  featuresInput.value = project.features?.join(", ") || "";
  showEditModal.value = true;
};

const closeModal = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  editingProject.value = null;
  resetForm();
};

const resetForm = () => {
  form.value = {
    title: "",
    shortDescription: "",
    description: "",
    image: "",
    category: "",
    client: "",
    duration: "",
    budget: "",
    technologies: [],
    features: [],
    challenges: "",
    solutions: "",
    results: "",
    liveUrl: "",
    githubUrl: "",
    featured: false,
    order: 0,
  };
  technologiesInput.value = "";
  featuresInput.value = "";
};

const submitProject = async () => {
  submitting.value = true;

  // Преобразуем строки в массивы
  form.value.technologies = technologiesInput.value
    .split(",")
    .map((tech) => tech.trim())
    .filter((tech) => tech);

  form.value.features = featuresInput.value
    .split(",")
    .map((feature) => feature.trim())
    .filter((feature) => feature);

  try {
    if (showEditModal.value) {
      await updateProject(editingProject.value.id, form.value);
    } else {
      await createProject(form.value);
    }
    closeModal();
  } catch (err) {
    console.error("Error submitting project:", err);
  } finally {
    submitting.value = false;
  }
};

const handleDeleteProject = async (id) => {
  if (confirm("Вы уверены, что хотите удалить этот проект?")) {
    await deleteProject(id);
  }
};
</script>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
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
}

.create-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.loading,
.error {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--color-primary);
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

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.project-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--background-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.project-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.project-image {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}

.project-details h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.project-details p {
  margin: 0 0 0.5rem 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.project-meta {
  display: flex;
  gap: 0.5rem;
}

.category {
  background: var(--color-primary);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.featured {
  background: #fbbf24;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.project-actions {
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
  max-width: 600px;
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

.project-form {
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
  .admin-container {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .project-item {
    flex-direction: column;
    gap: 1rem;
  }

  .project-actions {
    width: 100%;
    justify-content: center;
  }
}
</style>
