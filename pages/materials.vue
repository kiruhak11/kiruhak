<template>
  <NuxtLayout>
    <main class="materials-page">
      <div class="container">
        <!-- Заголовок страницы -->
        <div class="header-section">
          <h1 class="main-title">
            <GradientText variant="warning">Полезные материалы</GradientText>
          </h1>
          <p class="subtitle">
            Чек-листы, шаблоны и архитектурные решения для веб-разработки
          </p>
        </div>

        <!-- Фильтры -->
        <div class="filters-section">
          <div class="filter-group">
            <label>Тип материала:</label>
            <select v-model="selectedType" class="filter-select">
              <option value="">Все типы</option>
              <option value="checklist">Чек-листы</option>
              <option value="template">Шаблоны</option>
              <option value="architecture">Архитектура</option>
              <option value="guide">Руководства</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Категория:</label>
            <select v-model="selectedCategory" class="filter-select">
              <option value="">Все категории</option>
              <option value="performance">Производительность</option>
              <option value="security">Безопасность</option>
              <option value="ui">UI/UX</option>
              <option value="deployment">Deployment</option>
            </select>
          </div>
        </div>

        <!-- Список материалов -->
        <div class="materials-grid">
          <div
            v-for="material in filteredMaterials"
            :key="material.id"
            class="material-card"
            @click="openMaterial(material)"
          >
            <div class="material-header">
              <div class="material-icon">
                <component :is="material.icon" />
              </div>
              <div class="material-meta">
                <span :class="['type-badge', material.type]">
                  {{ getTypeText(material.type) }}
                </span>
                <span class="pages">{{ material.pages }} стр.</span>
              </div>
            </div>

            <h3 class="material-title">{{ material.title }}</h3>
            <p class="material-description">{{ material.description }}</p>

            <div class="material-features">
              <span
                v-for="feature in material.features"
                :key="feature"
                class="feature"
              >
                {{ feature }}
              </span>
            </div>

            <div class="material-stats">
              <div class="stat">
                <span class="stat-value">{{
                  material.downloadCount || 0
                }}</span>
                <span class="stat-label">Загрузок</span>
              </div>
              <div class="stat">
                <MaterialRatingDisplay
                  :avg-rating="material.avgRating || 0"
                  :rating-count="material.ratingCount || 0"
                />
              </div>
            </div>

            <button class="material-button">Открыть материал</button>
          </div>
        </div>

        <!-- Модалка материала -->
        <div
          v-if="selectedMaterial"
          class="material-modal"
          @click="closeMaterial"
        >
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h2>{{ selectedMaterial.title }}</h2>
              <button @click="closeMaterial" class="close-button">
                <MaterialIcons type="close" />
              </button>
            </div>

            <div class="modal-body">
              <div class="material-content">
                <div v-html="selectedMaterial.content"></div>
              </div>

              <div
                v-if="
                  !selectedMaterial.userRating ||
                  selectedMaterial.userRating === 0
                "
                class="material-rating-section"
              >
                <!-- Отладочная информация -->
                <div
                  style="font-size: 12px; color: #666; margin-bottom: 10px"
                ></div>
                <h3>Оцените материал</h3>
                <MaterialRating
                  :material-id="selectedMaterial.id"
                  :initial-rating="selectedMaterial.userRating || 0"
                  :avg-rating="selectedMaterial.avgRating || 0"
                  :rating-count="selectedMaterial.ratingCount || 0"
                  @rating-changed="handleRatingChanged"
                  @already-rated="handleAlreadyRated"
                />
              </div>

              <div class="material-actions">
                <button
                  @click="
                    () => {
                      console.log('🔐 Materials: Кнопка скачать нажата');
                      downloadMaterial();
                    }
                  "
                  class="action-button download"
                  :disabled="downloading"
                >
                  <MaterialIcons type="download" />
                  {{ downloading ? "Скачивание..." : "Скачать PDF" }}
                </button>
                <button @click="shareMaterial" class="action-button share">
                  <MaterialIcons type="share" />
                  Поделиться
                </button>
                <button
                  @click="bookmarkMaterial"
                  class="action-button bookmark"
                >
                  <MaterialIcons type="bookmark" />
                  В закладки
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
import { ref, computed, nextTick } from "vue";
import GradientText from "~/components/GradientText.vue";

// Фильтры
const selectedType = ref("");
const selectedCategory = ref("");

// Состояние модалки
const selectedMaterial = ref(null);

// Данные материалов
const materials = ref([]);
const loading = ref(true);

// Загрузка материалов с сервера
const loadMaterials = async () => {
  try {
    loading.value = true;
    const response = await apiFetch("/api/materials");
    if (response.success) {
      materials.value = response.materials.map((material) => ({
        ...material,
        downloads: material.downloadCount,
        rating: material.avgRating,
        icon: getMaterialIcon(material.type),
      }));
    }
  } catch (error) {
    console.error("Ошибка загрузки материалов:", error);
  } finally {
    loading.value = false;
  }
};

// Получение иконки для материала
const getMaterialIcon = (type) => {
  const icons = {
    checklist: "IconChecklist",
    template: "IconTemplate",
    architecture: "IconArchitecture",
    guide: "IconGuide",
  };
  return icons[type] || "IconChecklist";
};

// Фильтрация материалов
const filteredMaterials = computed(() => {
  return materials.value.filter((material) => {
    const typeMatch =
      !selectedType.value || material.type === selectedType.value;
    const categoryMatch =
      !selectedCategory.value || material.category === selectedCategory.value;
    return typeMatch && categoryMatch;
  });
});

// Методы
const getTypeText = (type: string) => {
  const texts = {
    checklist: "Чек-лист",
    template: "Шаблон",
    architecture: "Архитектура",
    guide: "Руководство",
  };
  return texts[type] || type;
};

const openMaterial = async (material) => {
  console.log("🔐 Materials: Открытие модалки для материала", material.id);

  // Загружаем актуальную информацию о материале
  try {
    const response = await apiFetch(`/api/materials/${material.id}`);
    if (response.success) {
      console.log(
        "🔐 Materials: Получена актуальная информация о материале",
        response.material
      );
      selectedMaterial.value = response.material;
    } else {
      console.error("🔐 Materials: Ошибка загрузки материала", response.error);
      selectedMaterial.value = material;
    }
  } catch (error) {
    console.error("🔐 Materials: Ошибка загрузки материала", error);
    selectedMaterial.value = material;
  }
};

const closeMaterial = () => {
  selectedMaterial.value = null;
};

const downloading = ref(false);

const downloadMaterial = async () => {
  console.log("🔐 Materials: downloadMaterial вызвана");
  console.log("🔐 Materials: selectedMaterial", selectedMaterial.value);

  if (!selectedMaterial.value) {
    console.log("🔐 Materials: Нет выбранного материала");
    return;
  }

  if (downloading.value) {
    console.log("🔐 Materials: Уже скачивается, пропускаем");
    return;
  }

  try {
    console.log("🔐 Materials: Начинаем процесс скачивания");
    downloading.value = true;

    console.log("🔐 Materials: Проверяем пользователя");
    const { user, checkTokenStatus, forceRefreshToken } = useAuth();
    console.log("🔐 Materials: user", user.value);

    // Проверяем состояние токена
    const tokenStatus = checkTokenStatus();
    console.log("🔐 Materials: tokenStatus", tokenStatus);

    if (!user.value) {
      console.log(
        "🔐 Materials: Пользователь не авторизован, пытаемся обновить токен"
      );

      // Пытаемся обновить токен
      const refreshed = await forceRefreshToken();
      console.log("🔐 Materials: Токен обновлен", refreshed);

      if (!refreshed) {
        console.log("🔐 Materials: Не удалось обновить токен");
        alert("Необходимо войти в аккаунт для скачивания материала");
        return;
      }
    }

    console.log("🔐 Materials: Пользователь авторизован, получаем токен");

    // Получаем токен из localStorage
    console.log("🔐 Materials: Получаем токен из localStorage");
    const token = localStorage.getItem("auth_token");
    console.log("🔐 Materials: token", token ? "present" : "missing");

    if (!token) {
      console.log("🔐 Materials: Токен отсутствует");
      alert("Ошибка аутентификации");
      return;
    }

    // Скачиваем PDF через fetch с заголовками авторизации
    const response = await fetch(
      `/api/materials/${selectedMaterial.value.id}/download-pdf-simple`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Получаем blob из ответа
    const blob = await response.blob();

    // Создаем URL для blob
    const url = window.URL.createObjectURL(blob);

    // Создаем временную ссылку для скачивания
    const link = document.createElement("a");
    link.href = url;

    // Создаем безопасное имя файла
    const safeFileName = selectedMaterial.value.title
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .toLowerCase();

    link.download = `${safeFileName}.txt`;

    // Добавляем ссылку в DOM и кликаем по ней
    document.body.appendChild(link);
    link.click();

    // Очищаем
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Обновляем счетчик загрузок
    selectedMaterial.value.downloadCount++;

    // Обновляем в списке материалов
    const materialIndex = materials.value.findIndex(
      (m) => m.id === selectedMaterial.value.id
    );
    if (materialIndex !== -1) {
      materials.value[materialIndex].downloadCount =
        selectedMaterial.value.downloadCount;
    }

    console.log("🔐 Materials: PDF успешно скачан");
  } catch (error) {
    console.error("🔐 Materials: Ошибка скачивания:", error);
    alert("Ошибка при скачивании материала");
  } finally {
    downloading.value = false;
  }
};

const shareMaterial = () => {
  if (navigator.share) {
    navigator.share({
      title: selectedMaterial.value.title,
      text: selectedMaterial.value.description,
      url: window.location.href,
    });
  } else {
    // Fallback для браузеров без поддержки Web Share API
    navigator.clipboard.writeText(window.location.href);
    alert("Ссылка скопирована в буфер обмена!");
  }
};

const bookmarkMaterial = () => {
  alert("Материал добавлен в закладки!");
};

const { apiFetch } = useApi();

const handleRatingChanged = async ({
  rating,
  materialId,
  newAvgRating,
  newRatingCount,
}) => {
  console.log("🔐 Materials: Обработка изменения рейтинга", {
    rating,
    materialId,
    newAvgRating,
    newRatingCount,
  });

  // Обновляем локальное состояние материала
  const materialIndex = materials.value.findIndex((m) => m.id === materialId);
  console.log("🔐 Materials: Индекс материала в списке", materialIndex);

  if (materialIndex !== -1) {
    console.log("🔐 Materials: Обновляем материал в списке");
    materials.value[materialIndex].avgRating = newAvgRating;
    materials.value[materialIndex].ratingCount = newRatingCount;
    materials.value[materialIndex].userRating = rating;

    // Обновляем отображение в модалке, если она открыта
    if (selectedMaterial.value && selectedMaterial.value.id === materialId) {
      console.log("🔐 Materials: Обновляем материал в модалке");
      console.log("🔐 Materials: До обновления", {
        userRating: selectedMaterial.value.userRating,
        avgRating: selectedMaterial.value.avgRating,
        ratingCount: selectedMaterial.value.ratingCount,
      });

      selectedMaterial.value.avgRating = newAvgRating;
      selectedMaterial.value.ratingCount = newRatingCount;
      selectedMaterial.value.userRating = rating;

      // Принудительно обновляем реактивность
      selectedMaterial.value = { ...selectedMaterial.value };

      console.log("🔐 Materials: После обновления", {
        userRating: selectedMaterial.value.userRating,
        avgRating: selectedMaterial.value.avgRating,
        ratingCount: selectedMaterial.value.ratingCount,
      });

      // Добавляем небольшую задержку для обновления DOM
      await nextTick();
      console.log("🔐 Materials: DOM обновлен");
    }
  }
};

// Функция для обработки случая, когда пользователь уже оценил материал
const handleAlreadyRated = async (materialId) => {
  console.log("🔐 Materials: Пользователь уже оценил материал", materialId);

  // Перезагружаем информацию о материале
  try {
    const response = await apiFetch(`/api/materials/${materialId}`);
    if (response.success) {
      console.log(
        "🔐 Materials: Обновляем информацию о материале",
        response.material
      );

      // Обновляем в списке
      const materialIndex = materials.value.findIndex(
        (m) => m.id === materialId
      );
      if (materialIndex !== -1) {
        materials.value[materialIndex] = {
          ...materials.value[materialIndex],
          ...response.material,
        };
      }

      // Обновляем в модалке
      if (selectedMaterial.value && selectedMaterial.value.id === materialId) {
        selectedMaterial.value = {
          ...selectedMaterial.value,
          ...response.material,
        };
        await nextTick();
      }
    }
  } catch (error) {
    console.error("🔐 Materials: Ошибка обновления материала", error);
  }
};

// Иконки (заглушки)
const IconChecklist = { template: "<div>✅</div>" };
const IconTemplate = { template: "<div>📄</div>" };
const IconArchitecture = { template: "<div>🏗️</div>" };
const IconSecurity = { template: "<div>🔒</div>" };
const IconDeployment = { template: "<div>🚀</div>" };
const IconGuide = { template: "<div>📚</div>" };

// Инициализируем аутентификацию и загружаем материалы при монтировании
onMounted(async () => {
  const { initAuth } = useAuth();
  await initAuth();
  loadMaterials();
});
</script>

<style lang="scss" scoped>
.materials-page {
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

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.material-card {
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

.material-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.material-icon {
  font-size: 2rem;
  color: var(--color-accent);
}

.material-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.type-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;

  &.checklist {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
  }

  &.template {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
  }

  &.architecture {
    background: rgba(168, 85, 247, 0.2);
    color: #a855f7;
  }

  &.guide {
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
  }
}

.pages {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.material-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: var(--color-text);
}

.material-description {
  color: var(--color-text-secondary);
  margin: 0 0 16px 0;
  line-height: 1.6;
}

.material-features {
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

.material-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  align-items: center;
}

.stat {
  text-align: center;

  .stat-value {
    display: block;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .stat-label {
    font-size: 0.8rem;
    color: var(--color-text-secondary);
  }

  // Специальные стили для рейтинга
  &:last-child {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}

.material-button {
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
.material-modal {
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

.material-content {
  margin-bottom: 32px;

  h3 {
    color: var(--color-text);
    margin-bottom: 16px;
  }

  h4 {
    color: var(--color-text);
    margin: 24px 0 12px 0;
  }

  h5 {
    color: var(--color-text);
    margin: 20px 0 8px 0;
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

  pre {
    background: var(--background-color-secondary);
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
    margin: 16px 0;

    code {
      font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
      font-size: 0.9rem;
      line-height: 1.5;
    }
  }
}

.material-rating-section {
  margin: 24px 0;
  padding: 20px;
  background: var(--background-color-secondary);
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s ease;

  h3 {
    margin: 0 0 16px 0;
    font-size: 1.2rem;
    color: var(--color-text);
  }
}

.material-rating-section-enter-active,
.material-rating-section-leave-active {
  transition: all 0.3s ease;
}

.material-rating-section-enter-from,
.material-rating-section-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.material-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-button {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;

  &.download {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  }

  &.share {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    }
  }

  &.bookmark {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
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

  .materials-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    margin: 10px;
    max-height: 95vh;
  }

  .modal-body {
    padding: 20px;
  }

  .material-actions {
    flex-direction: column;
  }

  .material-stats {
    justify-content: center;
  }
}
</style>
