<template>
  <div class="admin-layout">
    <AdminNavigation />
    <main class="admin-page">
      <div class="container">
        <!-- Заголовок -->
        <div class="header-section">
          <h1 class="main-title">
            <GradientText variant="primary">UI Компоненты</GradientText>
          </h1>
          <p class="subtitle">Управление компонентами для страницы контента</p>
        </div>

        <!-- Панель управления -->
        <div class="control-panel">
          <div class="search-filters">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Поиск компонентов..."
              class="search-input"
              @input="debouncedSearch"
            />
            <select
              v-model="selectedCategory"
              class="category-select"
              @change="loadComponents"
            >
              <option value="">Все категории</option>
              <option value="buttons">Кнопки</option>
              <option value="inputs">Инпуты</option>
              <option value="cards">Карточки</option>
              <option value="modals">Модальные окна</option>
              <option value="forms">Формы</option>
              <option value="navigation">Навигация</option>
            </select>
          </div>
          <button @click="showCreateModal = true" class="create-button">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5V19"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M5 12H19"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Добавить компонент
          </button>
        </div>

        <!-- Список компонентов -->
        <div class="components-grid">
          <div
            v-for="component in components"
            :key="component.id"
            class="component-card"
            @click="editComponent(component)"
          >
            <div class="component-preview">
              <div v-if="component.preview" class="preview-image">
                <img :src="component.preview" :alt="component.name" />
              </div>
              <div v-else class="preview-placeholder">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                    ry="2"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                  <circle
                    cx="8.5"
                    cy="8.5"
                    r="1.5"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                  <polyline
                    points="21,15 16,10 5,21"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
              <div
                class="component-status"
                :class="{ active: component.isActive }"
              >
                {{ component.isActive ? "Активен" : "Неактивен" }}
              </div>
            </div>
            <div class="component-info">
              <h3 class="component-name">{{ component.name }}</h3>
              <p class="component-description">
                {{ component.description || "Без описания" }}
              </p>
              <div class="component-meta">
                <span class="category-badge">{{ component.category }}</span>
                <span class="order-number">#{{ component.order }}</span>
              </div>
              <div class="component-tags">
                <span
                  v-for="tag in component.tags.slice(0, 3)"
                  :key="tag"
                  class="tag"
                >
                  {{ tag }}
                </span>
                <span v-if="component.tags.length > 3" class="tag-more">
                  +{{ component.tags.length - 3 }}
                </span>
              </div>
            </div>
            <div class="component-actions">
              <button
                @click.stop="editComponent(component)"
                class="action-button edit"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11 4H4A2 2 0 0 0 2 6V20A2 2 0 0 0 4 22H18A2 2 0 0 0 20 20V13"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M18.5 2.5A2.121 2.121 0 0 1 21 5L11 15L7 16L8 12L18.5 2.5Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
              <button
                @click.stop="deleteComponent(component.id)"
                class="action-button delete"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline
                    points="3,6 5,6 21,6"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M19,6V20A2,2 0 0,1 17,22H7A2,2 0 0,1 5,20V6M8,6V4A2,2 0 0,1 10,2H14A2,2 0 0,1 16,4V6"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Модальное окно создания/редактирования -->
        <UiComponentModal
          v-if="showCreateModal || editingComponent"
          :component="editingComponent"
          @close="closeModal"
          @save="saveComponent"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import GradientText from "~/components/GradientText.vue";

// Состояние
const components = ref([]);
const searchQuery = ref("");
const selectedCategory = ref("");
const showCreateModal = ref(false);
const editingComponent = ref(null);
const loading = ref(false);

const { apiFetch } = useApi();

// Загрузка компонентов
const loadComponents = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (searchQuery.value) params.append("search", searchQuery.value);
    if (selectedCategory.value)
      params.append("category", selectedCategory.value);

    const response = await apiFetch(`/api/ui-components?${params}`);
    if (response.success) {
      components.value = response.components;
    }
  } catch (error) {
    console.error("Ошибка загрузки компонентов:", error);
  } finally {
    loading.value = false;
  }
};

// Debounced поиск
let searchTimeout: NodeJS.Timeout;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadComponents();
  }, 300);
};

// Редактирование компонента
const editComponent = (component) => {
  editingComponent.value = component;
};

// Удаление компонента
const deleteComponent = async (id) => {
  console.log("🔐 UI Components: Функция deleteComponent вызвана с ID:", id);

  // Убираем диалог подтверждения для быстрого удаления
  // if (!confirm("Вы действительно хотите удалить этот компонент? Это действие нельзя отменить.")) {
  //   console.log("🔐 UI Components: Пользователь отменил удаление");
  //   return;
  // }

  try {
    console.log("🔐 UI Components: Удаление компонента", id);
    const response = await apiFetch(`/api/ui-components/${id}`, {
      method: "DELETE",
    });
    if (response.success) {
      console.log("🔐 UI Components: Компонент успешно удален");
      await loadComponents();
    } else {
      console.log(
        "🔐 UI Components: Ошибка при удалении компонента:",
        response
      );
    }
  } catch (error) {
    console.error("🔐 UI Components: Ошибка удаления компонента:", error);
  }
};

// Закрытие модального окна
const closeModal = () => {
  showCreateModal.value = false;
  editingComponent.value = null;
};

// Сохранение компонента
const saveComponent = async (componentData) => {
  try {
    if (editingComponent.value) {
      // Обновление
      console.log(
        "🔐 UI Components: Обновление компонента",
        editingComponent.value.id
      );
      await apiFetch(`/api/ui-components/${editingComponent.value.id}`, {
        method: "PUT",
        body: componentData,
      });
    } else {
      // Создание
      console.log("🔐 UI Components: Создание нового компонента");
      await apiFetch("/api/ui-components", {
        method: "POST",
        body: componentData,
      });
    }

    await loadComponents();
    closeModal();
  } catch (error) {
    console.error("Ошибка сохранения компонента:", error);

    // Дополнительная диагностика ошибки
    if (error.status === 401) {
      console.error("🔐 UI Components: 401 ошибка - проблема с авторизацией");
      console.error("🔐 UI Components: Проверьте токен в localStorage");

      if (process.client) {
        const token = localStorage.getItem("auth_token");
        console.error("🔐 UI Components: Текущий токен:", {
          hasToken: !!token,
          tokenLength: token ? token.length : 0,
        });
      }
    }
  }
};

// Загрузка при монтировании
onMounted(async () => {
  await loadComponents();
});
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.admin-page {
  flex: 1;
  padding: 32px;
  margin-left: 250px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.header-section {
  text-align: center;
  margin-bottom: 48px;

  .main-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 16px 0;
  }

  .subtitle {
    font-size: 1.1rem;
    color: var(--color-text-secondary);
    margin: 0;
  }
}

.control-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 24px;
  flex-wrap: wrap;
}

.search-filters {
  display: flex;
  gap: 16px;
  flex: 1;
  max-width: 600px;
}

.search-input,
.category-select {
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--background-color);
  color: var(--color-text);
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
}

.search-input {
  flex: 1;
}

.category-select {
  min-width: 150px;
}

.create-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-accent);
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

.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.component-card {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: var(--card-shadow);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--card-shadow-hover);
    border-color: var(--color-accent);
  }
}

.component-preview {
  position: relative;
  height: 200px;
  background: var(--background-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  width: 100%;
  height: 100%;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.preview-placeholder {
  color: var(--color-text-secondary);
  opacity: 0.5;
}

.component-status {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;

  &.active {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
  }
}

.component-info {
  padding: 20px;
}

.component-name {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--color-text);
}

.component-description {
  color: var(--color-text-secondary);
  margin: 0 0 16px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.component-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.category-badge {
  background: rgba(102, 126, 234, 0.1);
  color: var(--color-accent);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.order-number {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.component-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  background: rgba(102, 126, 234, 0.1);
  color: var(--color-accent);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.tag-more {
  background: var(--background-color-secondary);
  color: var(--color-text-secondary);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.component-actions {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  background: var(--background-color-secondary);
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &.edit {
    background: rgba(102, 126, 234, 0.1);
    color: var(--color-accent);

    &:hover {
      background: var(--color-accent);
      color: white;
    }
  }

  &.delete {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;

    &:hover {
      background: #ef4444;
      color: white;
    }
  }
}

// Адаптивность
@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }

  .admin-page {
    margin-left: 0;
    padding: 20px;
  }

  .control-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .search-filters {
    flex-direction: column;
    max-width: none;
  }

  .components-grid {
    grid-template-columns: 1fr;
  }
}
</style>
