<template>
  <NuxtLayout>
    <main class="components-page">
      <div class="container">
        <!-- Заголовок страницы -->
        <div class="header-section">
          <h1 class="main-title">
            <GradientText variant="secondary">UI Компоненты</GradientText>
          </h1>
          <p class="subtitle">
            Коллекция готовых UI компонентов от сообщества
          </p>
        </div>

        <!-- Кнопка добавить компонент -->
        <div class="actions-section">
          <button @click="openAddModal" class="add-button">
            + Добавить свой компонент
          </button>
        </div>

        <!-- Фильтры -->
        <div class="filters-section">
          <div class="filter-group">
            <label>Категория:</label>
            <select v-model="selectedCategory" class="filter-select">
              <option value="">Все категории</option>
              <option value="buttons">Кнопки</option>
              <option value="inputs">Поля ввода</option>
              <option value="cards">Карточки</option>
              <option value="modals">Модальные окна</option>
              <option value="navigation">Навигация</option>
              <option value="forms">Формы</option>
              <option value="other">Другое</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Автор:</label>
            <select v-model="filterAuthor" class="filter-select">
              <option value="all">Все</option>
              <option value="admin">Администраторы</option>
              <option value="community">Сообщество</option>
              <option value="my">Мои компоненты</option>
            </select>
          </div>
        </div>

        <!-- Список компонентов -->
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>Загружаем компоненты...</p>
        </div>

        <div v-else class="components-grid">
          <div
            v-for="component in filteredComponents"
            :key="component.id"
            class="component-card"
            @click="openComponent(component)"
            style="cursor: pointer;"
          >
            <div class="component-header">
              <div class="component-category">{{ getCategoryName(component.category) }}</div>
              <div class="component-stats">
                <span class="view-count">👁 {{ component.viewCount }}</span>
              </div>
            </div>

            <h3 class="component-title">{{ component.name }}</h3>
            <p class="component-description">{{ component.description }}</p>

            <div class="component-tags">
              <span
                v-for="tag in component.tags?.slice(0, 3)"
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>

            <div class="component-footer">
              <div v-if="component.authorId" class="author-info">
                <span class="author-icon">👤</span>
                <span class="author-name">{{ getAuthorName(component) }}</span>
              </div>
              <div v-else class="author-info official">
                <span class="official-badge">✨ Официальный</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Модалка добавления компонента -->
        <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h2>Добавить UI компонент</h2>
              <button @click="closeAddModal" class="close-button">×</button>
            </div>

            <form @submit.prevent="submitComponent" class="component-form">
              <div class="form-group">
                <label>Название компонента *</label>
                <input v-model="form.name" type="text" required placeholder="Кнопка с градиентом" />
              </div>

              <div class="form-group">
                <label>Описание</label>
                <textarea v-model="form.description" rows="3" placeholder="Описание компонента"></textarea>
              </div>

              <div class="form-group">
                <label>Категория *</label>
                <select v-model="form.category" required>
                  <option value="">Выберите категорию</option>
                  <option value="buttons">Кнопки</option>
                  <option value="inputs">Поля ввода</option>
                  <option value="cards">Карточки</option>
                  <option value="modals">Модальные окна</option>
                  <option value="navigation">Навигация</option>
                  <option value="forms">Формы</option>
                  <option value="other">Другое</option>
                </select>
              </div>

              <div class="form-group">
                <label>HTML код *</label>
                <textarea v-model="form.html" rows="6" required placeholder="<div>...</div>" class="code-textarea"></textarea>
              </div>

              <div class="form-group">
                <label>CSS код *</label>
                <textarea v-model="form.css" rows="6" required placeholder=".class { }" class="code-textarea"></textarea>
              </div>

              <div class="form-group">
                <label>JavaScript код (необязательно)</label>
                <textarea v-model="form.js" rows="4" placeholder="// JavaScript код" class="code-textarea"></textarea>
              </div>

              <div class="form-group">
                <label>Теги (через запятую)</label>
                <input v-model="tagsInput" type="text" placeholder="button, gradient, animated" />
              </div>

              <div class="info-box">
                <p>
                  ℹ️ Ваш компонент будет отправлен на модерацию. После проверки вы получите уведомление в Telegram.
                </p>
              </div>

              <div class="form-actions">
                <button type="button" @click="closeAddModal" class="cancel-button">
                  Отмена
                </button>
                <button type="submit" :disabled="submitting" class="submit-button">
                  {{ submitting ? "Отправка..." : "Отправить на модерацию" }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Модалка просмотра компонента -->
        <div v-if="selectedComponent" class="modal-overlay" @click="closeComponent">
          <div class="modal-content large" @click.stop>
            <div class="modal-header modern">
              <div class="header-content">
                <h2>{{ selectedComponent.name }}</h2>
                <p class="header-description">{{ selectedComponent.description }}</p>
              </div>
              <button @click="closeComponent" class="close-button modern">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div class="component-details modern">
              <!-- Статистика и метаданные -->
              <div class="metadata-bar">
                <div class="metadata-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>{{ selectedComponent.viewCount }} просмотров</span>
                </div>
                <div class="metadata-item" v-if="selectedComponent.authorId">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>{{ getAuthorName(selectedComponent) }}</span>
                </div>
                <div class="metadata-item category">
                  <span class="category-badge">{{ getCategoryName(selectedComponent.category) }}</span>
                </div>
              </div>

              <!-- Превью -->
              <div class="component-preview modern">
                <div class="preview-header">
                  <h3>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                    Live Preview
                  </h3>
                </div>
                <div class="preview-frame modern">
                  <iframe
                    :srcdoc="getComponentPreview(selectedComponent)"
                    frameborder="0"
                    sandbox="allow-scripts"
                  ></iframe>
                </div>
              </div>

              <!-- Код -->
              <div class="component-code modern">
                <div class="code-tabs">
                  <button 
                    :class="['tab', { active: activeTab === 'html' }]"
                    @click="activeTab = 'html'"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="16 18 22 12 16 6"></polyline>
                      <polyline points="8 6 2 12 8 18"></polyline>
                    </svg>
                    HTML
                  </button>
                  <button 
                    :class="['tab', { active: activeTab === 'css' }]"
                    @click="activeTab = 'css'"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 2l9 4.5v9L12 20l-9-4.5v-9L12 2z"></path>
                    </svg>
                    CSS
                  </button>
                  <button 
                    v-if="selectedComponent.js"
                    :class="['tab', { active: activeTab === 'js' }]"
                    @click="activeTab = 'js'"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    JavaScript
                  </button>
                </div>

                <div class="code-content">
                  <div class="code-header">
                    <span class="code-language">{{ activeTab.toUpperCase() }}</span>
                    <button 
                      @click="copyCode(getCodeForTab())" 
                      class="copy-button"
                      :class="{ copied: codeCopied }"
                    >
                      <svg v-if="!codeCopied" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      {{ codeCopied ? 'Скопировано!' : 'Копировать' }}
                    </button>
                  </div>
                  <pre><code>{{ getCodeForTab() }}</code></pre>
                </div>
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

const { user, isAuthenticated, initAuth } = useAuth();
const { getAuthHeaders } = useApi();

// Состояние
const components = ref([]);
const loading = ref(true);
const selectedCategory = ref("");
const filterAuthor = ref("all");
const showAddModal = ref(false);
const selectedComponent = ref(null);
const submitting = ref(false);
const activeTab = ref('html');
const codeCopied = ref(false);

// Форма
const form = ref({
  name: "",
  description: "",
  category: "",
  html: "",
  css: "",
  js: "",
});
const tagsInput = ref("");

// Загрузка компонентов
const loadComponents = async () => {
  try {
    loading.value = true;
    const response = await $fetch("/api/ui-components", {
      headers: getAuthHeaders(),
    });
    if (response.success) {
      components.value = response.components;
      console.log("🎨 Загружено компонентов:", components.value.length);
    }
  } catch (error) {
    console.error("Ошибка загрузки компонентов:", error);
  } finally {
    loading.value = false;
  }
};

// Фильтрация
const filteredComponents = computed(() => {
  return components.value.filter((component) => {
    const categoryMatch = !selectedCategory.value || component.category === selectedCategory.value;
    
    let authorMatch = true;
    if (filterAuthor.value === "admin") {
      authorMatch = !component.authorId;
    } else if (filterAuthor.value === "community") {
      authorMatch = !!component.authorId;
    } else if (filterAuthor.value === "my") {
      authorMatch = component.authorId === user.value?.id;
    }
    
    return categoryMatch && authorMatch;
  });
});

// Методы
const getCategoryName = (category: string) => {
  const names = {
    buttons: "Кнопки",
    inputs: "Поля ввода",
    cards: "Карточки",
    modals: "Модальные окна",
    navigation: "Навигация",
    forms: "Формы",
    other: "Другое",
  };
  return names[category] || category;
};

const getAuthorName = (component: any) => {
  return component.author?.firstName || "Пользователь";
};

const openAddModal = () => {
  if (!isAuthenticated.value) {
    alert("Необходимо войти в систему");
    navigateTo("/login");
    return;
  }
  showAddModal.value = true;
};

const closeAddModal = () => {
  showAddModal.value = false;
  resetForm();
};

const resetForm = () => {
  form.value = {
    name: "",
    description: "",
    category: "",
    html: "",
    css: "",
    js: "",
  };
  tagsInput.value = "";
};

const submitComponent = async () => {
  try {
    submitting.value = true;

    const tags = tagsInput.value.split(",").map((t) => t.trim()).filter((t) => t);

    const response = await $fetch("/api/ui-components/submit", {
      method: "POST",
      headers: getAuthHeaders(),
      body: {
        ...form.value,
        tags,
      },
    });

    if (response.success) {
      alert("Компонент отправлен на модерацию! Вы получите уведомление в Telegram.");
      closeAddModal();
      await loadComponents();
    } else {
      alert(response.error || "Ошибка отправки компонента");
    }
  } catch (error) {
    console.error("Ошибка отправки компонента:", error);
    alert("Ошибка отправки компонента");
  } finally {
    submitting.value = false;
  }
};

const openComponent = async (component: any) => {
  selectedComponent.value = component;
  
  // Увеличиваем счетчик просмотров
  try {
    await $fetch(`/api/ui-components/${component.id}/view`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.error("Ошибка записи просмотра:", error);
  }
};

const closeComponent = () => {
  selectedComponent.value = null;
  activeTab.value = 'html';
  codeCopied.value = false;
};

const getCodeForTab = () => {
  if (!selectedComponent.value) return '';
  
  switch (activeTab.value) {
    case 'html':
      return selectedComponent.value.html || '';
    case 'css':
      return selectedComponent.value.css || '';
    case 'js':
      return selectedComponent.value.js || '';
    default:
      return '';
  }
};

const copyCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code);
    codeCopied.value = true;
    setTimeout(() => {
      codeCopied.value = false;
    }, 2000);
  } catch (error) {
    console.error('Ошибка копирования:', error);
  }
};

const getComponentPreview = (component: any) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; padding: 20px; font-family: sans-serif; }
          ${component.css}
        </style>
      </head>
      <body>
        ${component.html}
        ${component.js ? `<script>${component.js}<\/script>` : ''}
      </body>
    </html>
  `;
};

// Загрузка при монтировании
onMounted(async () => {
  await initAuth();
  await loadComponents();
});
</script>

<style lang="scss" scoped>
// Базовые стили
.components-page {
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

.loading {
  text-align: center;
  padding: 4rem 2rem;

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--border-color);
    border-top: 4px solid var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
}

.component-card {
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

.component-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: var(--color-text);
}

.component-description {
  color: var(--color-text-secondary);
  margin: 0 0 16px 0;
  line-height: 1.6;
}

// Модалки
.modal-overlay {
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

  &.large {
    max-width: 900px;
  }
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
    background: var(--background-secondary);
    color: var(--color-text);
  }
}

.component-form {
  padding: 24px 32px;

  .form-group {
    margin-bottom: 20px;

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: var(--color-text);
    }

    input,
    textarea,
    select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--background-color);
      color: var(--color-text);
      font-size: 1rem;

      &:focus {
        outline: none;
        border-color: var(--color-accent);
      }
    }

    textarea {
      resize: vertical;
      font-family: inherit;
    }
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
  }
}

.cancel-button,
.submit-button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-button {
  background: var(--background-secondary);
  color: var(--color-text);

  &:hover {
    background: var(--border-color);
  }
}

.submit-button {
  background: var(--gradient-primary);
  color: white;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.actions-section {
  text-align: center;
  margin-bottom: 32px;
}

.add-button {
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.05rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }
}

.component-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.component-category {
  padding: 4px 12px;
  background: rgba(102, 126, 234, 0.1);
  color: var(--color-accent);
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.component-stats {
  display: flex;
  gap: 12px;
  align-items: center;
}

.view-count {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.component-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--color-text-secondary);

  &.official {
    justify-content: center;
  }
}

.official-badge {
  color: var(--color-accent);
  font-weight: 600;
}

.component-form {
  .code-textarea {
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
    font-size: 0.9rem;
    line-height: 1.5;
  }
}

.info-box {
  background: rgba(102, 126, 234, 0.1);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;

  p {
    margin: 0;
    color: var(--color-text);
    font-size: 0.95rem;
    line-height: 1.6;
  }
}

// Современная модалка
.modal-header.modern {
  padding: 32px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
  border-bottom: 1px solid var(--border-color);

  .header-content {
    flex: 1;

    h2 {
      margin: 0 0 8px 0;
      font-size: 2rem;
      color: var(--color-text);
    }

    .header-description {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: 1.05rem;
      line-height: 1.6;
    }
  }
}

.close-button.modern {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--background-secondary);
  transition: all 0.3s ease;

  svg {
    stroke: var(--color-text-secondary);
  }

  &:hover {
    background: var(--border-color);
    transform: rotate(90deg);

    svg {
      stroke: var(--color-text);
    }
  }
}

.component-details.modern {
  padding: 32px;
}

.metadata-bar {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
  padding: 16px;
  background: var(--background-secondary);
  border-radius: 12px;
  flex-wrap: wrap;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 0.95rem;

  svg {
    stroke: var(--color-accent);
  }

  &.category {
    margin-left: auto;
  }
}

.component-preview.modern {
  margin-bottom: 32px;

  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    h3 {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      font-size: 1.3rem;
      color: var(--color-text);

      svg {
        stroke: var(--color-accent);
      }
    }
  }
}

.preview-frame.modern {
  width: 100%;
  height: 400px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

  iframe {
    width: 100%;
    height: 100%;
  }
}

.component-code.modern {
  .code-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    border-bottom: 2px solid var(--border-color);
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 20px;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    color: var(--color-text-secondary);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: -2px;

    svg {
      stroke: currentColor;
    }

    &:hover {
      color: var(--color-accent);
      background: rgba(102, 126, 234, 0.05);
    }

    &.active {
      color: var(--color-accent);
      border-bottom-color: var(--color-accent);
    }
  }

  .code-content {
    background: #1e1e1e;
    border-radius: 12px;
    overflow: hidden;
  }

  .code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: #2d2d2d;
    border-bottom: 1px solid #3d3d3d;

    .code-language {
      color: #888;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }

  .copy-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: rgba(102, 126, 234, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.3);
    border-radius: 6px;
    color: #667eea;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    svg {
      stroke: currentColor;
    }

    &:hover {
      background: rgba(102, 126, 234, 0.2);
      transform: translateY(-1px);
    }

    &.copied {
      background: rgba(34, 197, 94, 0.1);
      border-color: rgba(34, 197, 94, 0.3);
      color: #22c55e;
    }
  }

  pre {
    padding: 24px;
    margin: 0;
    overflow-x: auto;
    background: #1e1e1e;

    code {
      font-family: "Monaco", "Menlo", "Fira Code", "Ubuntu Mono", monospace;
      font-size: 0.9rem;
      line-height: 1.7;
      color: #d4d4d4;
      font-weight: 400;
    }
  }
}

.modal-content.large {
  max-width: 900px;
}

@media (max-width: 768px) {
  .components-grid {
    grid-template-columns: 1fr;
  }

  .modal-content.large {
    max-width: 95%;
  }
}
</style>

