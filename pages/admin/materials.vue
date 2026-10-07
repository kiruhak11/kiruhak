<template>
  <div class="admin-layout">
    <AdminNavigation />
    <div class="admin-container">
      <div class="header">
        <h1>Управление материалами</h1>
        <button @click="openCreateModal" class="create-button">
          + Добавить материал
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Загружаем материалы...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="fetchMaterials">Попробовать снова</button>
      </div>

      <!-- Materials list -->
      <div v-else class="materials-list">
        <div
          v-for="material in materials"
          :key="material.id"
          class="material-item"
        >
          <div class="material-info">
            <div class="material-icon">
              <span class="icon">{{ getMaterialIcon(material.type) }}</span>
            </div>
            <div class="material-details">
              <h3>{{ material.title }}</h3>
              <p>{{ material.description }}</p>
              <div class="material-meta">
                <span class="type">{{ getTypeText(material.type) }}</span>
                <span class="category">{{ material.category }}</span>
                <span class="pages">{{ material.pages }} стр.</span>
                <span v-if="material.isActive" class="status active"
                  >Активен</span
                >
                <span v-else class="status inactive">Неактивен</span>
              </div>
              <div class="material-stats">
                <span>{{ material.downloadCount || 0 }} загрузок</span>
                <MaterialRatingDisplay
                  :avg-rating="material.avgRating || 0"
                  :rating-count="material.ratingCount || 0"
                />
              </div>
            </div>
          </div>
          <div class="material-actions">
            <button @click="editMaterial(material)" class="edit-button">Редактировать</button>
            <button
              @click="handleDeleteMaterial(material.id)"
              class="delete-button"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <AdminDialog :model-value="showCreateModal || showEditModal" :title="showEditModal ? 'Редактировать материал' : 'Создать материал'" size="lg" @request-close="requestClose">

          <form id="material-editor" @submit.prevent="submitMaterial" class="material-form">
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
                <label>Тип *</label>
                <select v-model="form.type" required>
                  <option value="checklist">Чек-лист</option>
                  <option value="template">Шаблон</option>
                  <option value="architecture">Архитектура</option>
                  <option value="guide">Руководство</option>
                </select>
              </div>

              <div class="form-group">
                <label>Категория *</label>
                <select v-model="form.category" required>
                  <option value="performance">Производительность</option>
                  <option value="security">Безопасность</option>
                  <option value="ui">UI/UX</option>
                  <option value="deployment">Deployment</option>
                </select>
              </div>

              <div class="form-group">
                <label>Количество страниц *</label>
                <input v-model="form.pages" type="number" min="1" required />
              </div>
            </div>

            <div class="form-group">
              <label>Особенности (через запятую)</label>
              <input
                v-model="featuresInput"
                type="text"
                placeholder="Производительность, SEO, UX, Мониторинг"
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
              <label>Контент (HTML) *</label>
              <textarea
                v-model="form.content"
                rows="12"
                placeholder="HTML контент материала..."
                required
              ></textarea>
            </div>

          </form>
          <template #footer><div class="form-actions"><button type="button" @click="requestClose" class="cancel-button">Отмена</button><button type="submit" form="material-editor" :disabled="submitting" class="submit-button">{{ submitting ? "Сохранение..." : showEditModal ? "Обновить" : "Создать" }}</button></div></template>
      </AdminDialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

// State
const materials = ref([]);
const loading = ref(true);
const error = ref(null);
const submitting = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const editingMaterial = ref(null);
const originalForm = ref("");

// Form
const form = ref({
  title: "",
  description: "",
  type: "checklist",
  category: "performance",
  pages: 1,
  features: [],
  order: 0,
  isActive: true,
  content: "",
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

const { apiFetch } = useApi();

// Methods
const fetchMaterials = async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await apiFetch("/api/materials");
    if (response.success) {
      materials.value = response.materials;
    } else {
      error.value = response.error || "Ошибка загрузки материалов";
    }
  } catch (err) {
    console.error("Ошибка загрузки материалов:", err);
    error.value = "Ошибка загрузки материалов";
  } finally {
    loading.value = false;
  }
};

const getTypeText = (type) => {
  const texts = {
    checklist: "Чек-лист",
    template: "Шаблон",
    architecture: "Архитектура",
    guide: "Руководство",
  };
  return texts[type] || type;
};

const getMaterialIcon = (type) => {
  const icons = {
    checklist: "✅",
    template: "📄",
    architecture: "🏗️",
    guide: "📚",
  };
  return icons[type] || "📄";
};

const editMaterial = (material) => {
  editingMaterial.value = material;
  form.value = {
    title: material.title,
    description: material.description,
    type: material.type,
    category: material.category,
    pages: material.pages,
    features: material.features || [],
    order: material.order,
    isActive: material.isActive,
    content: material.content,
  };
  originalForm.value = JSON.stringify(form.value);
  showEditModal.value = true;
};

const openCreateModal = () => {
  editingMaterial.value = null;
  resetForm();
  originalForm.value = JSON.stringify(form.value);
  showCreateModal.value = true;
};

const requestClose = () => {
  if (JSON.stringify(form.value) !== originalForm.value && !window.confirm("Есть несохранённые изменения. Закрыть редактор?")) return;
  closeModal();
};

const closeModal = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  editingMaterial.value = null;
  resetForm();
};

const resetForm = () => {
  form.value = {
    title: "",
    description: "",
    type: "checklist",
    category: "performance",
    pages: 1,
    features: [],
    order: 0,
    isActive: true,
    content: "",
  };
};

const submitMaterial = async () => {
  try {
    submitting.value = true;

    const materialData = {
      ...form.value,
    };

    if (editingMaterial.value) {
      await apiFetch(`/api/materials/${editingMaterial.value.id}`, {
        method: "PUT",
        body: materialData,
      });
    } else {
      await apiFetch("/api/materials", {
        method: "POST",
        body: materialData,
      });
    }

    closeModal();
    await fetchMaterials();
  } catch (err) {
    console.error("Ошибка сохранения материала:", err);
    alert("Ошибка сохранения материала");
  } finally {
    submitting.value = false;
  }
};

const handleDeleteMaterial = async (id) => {
  if (!confirm("Вы уверены, что хотите удалить этот материал?")) {
    return;
  }

  try {
    await apiFetch(`/api/materials/${id}`, {
      method: "DELETE",
    });
    await fetchMaterials();
  } catch (err) {
    console.error("Ошибка удаления материала:", err);
    alert("Ошибка удаления материала");
  }
};

// Lifecycle
onMounted(() => {
  fetchMaterials();
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

.materials-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.material-item {
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

.material-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.material-icon {
  width: 60px;
  height: 60px;
  background: var(--gradient-primary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.material-details h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.material-details p {
  margin: 0 0 0.5rem 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.material-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.type,
.category,
.pages,
.status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.type {
  background: #8b5cf6;
  color: white;
}

.category {
  background: #10b981;
  color: white;
}

.pages {
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

.material-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  align-items: center;
}

.material-actions {
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

.material-form {
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

  .material-item {
    flex-direction: column;
    gap: 1rem;
  }

  .material-actions {
    width: 100%;
    justify-content: center;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
