<template>
  <NuxtLayout>
    <main class="content-page">
      <div class="container">
        <!-- Заголовок страницы -->
        <div class="header-section">
          <h1 class="main-title">
            <GradientText variant="primary">Эксклюзивный контент</GradientText>
          </h1>
          <p class="subtitle">Доступно только подписчикам Telegram канала</p>
        </div>

        <!-- Проверка подписки -->
        <div v-if="!isSubscribed" class="subscription-check">
          <div class="subscription-card">
            <div class="subscription-icon">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22 2L11 13"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M22 2L15 22L11 13L2 9L22 2Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <h2>Подпишитесь на Telegram канал</h2>
            <p>
              Для доступа к эксклюзивному контенту необходимо подписаться на наш
              Telegram канал
            </p>

            <div class="channel-info">
              <div class="channel-card">
                <div class="channel-icon">
                  <IconTg />
                </div>
                <div class="channel-details">
                  <h3>{{ displayChannelUsername }}</h3>
                  <p>Эксклюзивный контент по веб-разработке</p>
                </div>
              </div>
            </div>

            <button
              @click="() => checkSubscription(true)"
              class="check-button"
              :disabled="checking"
            >
              {{ checking ? "Проверяем..." : "Проверить подписку" }}
            </button>

            <div class="subscription-steps">
              <h3>Как получить доступ:</h3>
              <ol>
                <li>
                  Подпишитесь на канал
                  <strong>{{ displayChannelUsername }}</strong>
                </li>
                <li>Нажмите кнопку "Проверить подписку"</li>
                <li>Получите доступ к эксклюзивному контенту</li>
              </ol>
            </div>
          </div>
        </div>

        <!-- Контент для подписчиков -->
        <div v-else class="exclusive-content">
          <div class="welcome-message">
            <h2>Добро пожаловать в эксклюзивный раздел! 🎉</h2>
            <p>
              Спасибо за подписку на наш Telegram канал. Здесь вы найдете
              уникальный контент по веб-разработке.
            </p>
          </div>

          <!-- Секции контента -->
          <div class="content-sections">
            <!-- Туториалы -->
            <div class="content-section">
              <h3>
                <GradientText variant="secondary"
                  >Туториалы по Vue.js</GradientText
                >
              </h3>
              <div class="tutorials-grid">
                <NuxtLink to="/tutorials" class="tutorial-card">
                  <div class="tutorial-header">
                    <h4>Vue 3 Composition API</h4>
                    <span class="difficulty beginner">Начинающий</span>
                  </div>
                  <p>
                    Полное руководство по использованию Composition API в Vue 3
                  </p>
                  <div class="tutorial-meta">
                    <span>⏱️ 15 мин</span>
                    <span>📝 Код + примеры</span>
                  </div>
                  <button class="tutorial-button">Начать туториал</button>
                </NuxtLink>

                <NuxtLink to="/tutorials" class="tutorial-card">
                  <div class="tutorial-header">
                    <h4>Nuxt 3 - SSR и SSG</h4>
                    <span class="difficulty intermediate">Средний</span>
                  </div>
                  <p>
                    Разбираем Server-Side Rendering и Static Site Generation
                  </p>
                  <div class="tutorial-meta">
                    <span>⏱️ 25 мин</span>
                    <span>🚀 Продакшен</span>
                  </div>
                  <button class="tutorial-button">Начать туториал</button>
                </NuxtLink>

                <NuxtLink to="/tutorials" class="tutorial-card">
                  <div class="tutorial-header">
                    <h4>Vue + TypeScript</h4>
                    <span class="difficulty advanced">Продвинутый</span>
                  </div>
                  <p>Типизация в Vue.js проектах с TypeScript</p>
                  <div class="tutorial-meta">
                    <span>⏱️ 30 мин</span>
                    <span>🔧 TypeScript</span>
                  </div>
                  <button class="tutorial-button">Начать туториал</button>
                </NuxtLink>
              </div>
            </div>

            <!-- Полезные материалы -->
            <div class="content-section">
              <h3>
                <GradientText variant="warning"
                  >Полезные материалы</GradientText
                >
              </h3>
              <div class="materials-grid">
                <NuxtLink to="/materials" class="material-card">
                  <h4>Чек-лист оптимизации</h4>
                  <p>
                    50+ пунктов для оптимизации производительности Vue.js
                    приложений
                  </p>
                  <button class="material-button">Открыть материалы</button>
                </NuxtLink>

                <NuxtLink to="/materials" class="material-card">
                  <h4>Шаблоны компонентов</h4>
                  <p>Готовые шаблоны для часто используемых компонентов</p>
                  <button class="material-button">Открыть материалы</button>
                </NuxtLink>

                <NuxtLink to="/materials" class="material-card">
                  <h4>Архитектурные решения</h4>
                  <p>Лучшие практики организации кода в больших проектах</p>
                  <button class="material-button">Открыть материалы</button>
                </NuxtLink>
              </div>
            </div>

            <!-- UI Компоненты -->
            <div class="content-section">
              <h3>
                <GradientText variant="success">UI Компоненты</GradientText>
              </h3>

              <div class="ui-components-grid">
                <!-- Два случайных компонента -->
                <div
                  v-for="component in randomTwoComponents"
                  :key="component.id"
                  class="ui-component-card"
                  @click="navigateTo('/ui-components')"
                  style="cursor: pointer"
                >
                  <div class="component-preview">
                    <div class="preview-placeholder">
                      <iframe
                        class="component-demo-frame"
                        :srcdoc="getComponentPreview(component)"
                        sandbox="allow-scripts"
                        frameborder="0"
                        loading="lazy"
                      ></iframe>
                    </div>
                  </div>
                  <div class="component-info">
                    <h4 class="component-name">{{ component.name }}</h4>
                    <p class="component-description">
                      {{ component.description || "Без описания" }}
                    </p>
                    <div class="component-meta">
                      <span class="category-badge">{{
                        component.category
                      }}</span>
                      <span class="view-count"
                        >👁 {{ component.viewCount || 0 }}</span
                      >
                    </div>
                  </div>
                </div>

                <!-- Карточка-призыв к действию -->
                <div
                  class="ui-component-card cta-component-card"
                  @click="navigateTo('/ui-components')"
                >
                  <div class="cta-component-content">
                    <div class="cta-icon">🎨</div>
                    <h4 class="cta-title">Получить больше компонентов</h4>
                    <p class="cta-description">
                      Нажми на меня, чтобы увидеть полную коллекцию UI
                      компонентов
                    </p>
                    <div class="cta-stats-badge">
                      {{ uiComponents.length }}+ компонентов
                    </div>
                    <div class="cta-arrow">→</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Модалка для отображения кода -->
    <CodeModal
      :is-open="showCodeModal"
      :component="selectedComponent || undefined"
      @close="closeCodeModal"
    />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import GradientText from "~/components/GradientText.vue";
import CodeModal from "~/components/CodeModal.vue";

// Типы
interface UiComponent {
  id: string;
  name: string;
  code: string;
  html: string | null;
  css: string | null;
  js: string | null;
  description: string | null;
  category: string;
  viewCount: number;
}

// Состояние подписки
const isSubscribed = ref(false);
const checking = ref(false);
const subscriptionCheckInterval = ref<ReturnType<typeof setInterval> | null>(
  null,
);
const runtimeConfig = useRuntimeConfig();
const rawChannelUsername = String(
  runtimeConfig.public.channelUsername || "",
).trim();
const normalizedChannelUsername =
  !rawChannelUsername ||
  rawChannelUsername.toLowerCase() === "channel" ||
  rawChannelUsername.toLowerCase() === "@channel"
    ? "webmonkey"
    : rawChannelUsername.replace(/^@/, "");
const displayChannelUsername = `@${normalizedChannelUsername}`;

// UI компоненты
const uiComponents = ref<UiComponent[]>([]);

// Два случайных компонента
const randomTwoComponents = computed(() => {
  if (uiComponents.value.length === 0) {
    return [];
  }

  if (uiComponents.value.length <= 2) {
    return uiComponents.value;
  }

  // Получаем 2 случайных компонента
  const shuffled = [...uiComponents.value].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 2);
});

// Проверка подписки на Telegram канал
const checkSubscription = async (showAlert = true) => {
  checking.value = true;

  try {
    // Используем данные из useAuth вместо прямого запроса
    const { user, initAuth } = useAuth();
    const { apiFetch } = useApi();

    // Инициализируем аутентификацию, если данные еще не загружены
    if (!user.value) {
      await initAuth();
    }

    if (!user.value) {
      throw new Error("Пользователь не авторизован");
    }

    // Проверяем подписку через API
    const response = await apiFetch<{
      success: boolean;
      isSubscribed?: boolean;
      channelUsername?: string;
      error?: string;
      telegramError?: string;
      memberStatus?: string;
    }>("/api/telegram/check-subscription", {
      method: "POST",
    });

    if (response.success && response.isSubscribed) {
      isSubscribed.value = true;
      // Сохраняем статус в localStorage
      localStorage.setItem("telegram_subscribed", "true");
    } else {
      isSubscribed.value = false;
      localStorage.removeItem("telegram_subscribed");

      // Показываем сообщение об ошибке только если это не автоматическая проверка
      if (showAlert) {
        alert(
          `Вы не подписаны на канал ${displayChannelUsername}. Пожалуйста, подпишитесь и попробуйте снова.`,
        );
      }
    }
  } catch (error) {
    console.error("Ошибка проверки подписки:", error);
    isSubscribed.value = false;
    localStorage.removeItem("telegram_subscribed");

    // Показываем сообщение об ошибке только если это не автоматическая проверка
    if (showAlert) {
      alert("Ошибка при проверке подписки. Попробуйте позже.");
    }
  } finally {
    checking.value = false;
  }
};

// Загрузка UI компонентов
const loadUiComponents = async () => {
  try {
    const response = await $fetch<{
      success: boolean;
      components?: UiComponent[];
      error?: string;
    }>("/api/ui-components");

    if (response.success && response.components) {
      uiComponents.value = response.components;
    }
  } catch (error) {
    console.error("Ошибка загрузки UI компонентов:", error);
  }
};

// Модалка для отображения кода
const showCodeModal = ref(false);
const selectedComponent = ref<UiComponent | null>(null);

const closeCodeModal = () => {
  showCodeModal.value = false;
  selectedComponent.value = null;
};

const getComponentPreview = (component: UiComponent) => {
  const html = component.html || component.code || "";
  const css = component.css || "";
  const js = component.js || "";
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { margin: 0; padding: 8px; font-family: Arial, sans-serif; }
          ${css}
        </style>
      </head>
      <body>
        ${html}
        ${js ? `<script>${js}<\/script>` : ""}
      </body>
    </html>
  `;
};

// Проверяем подписку при загрузке страницы
onMounted(async () => {
  // Инициализируем аутентификацию
  const { user, initAuth } = useAuth();

  if (!user.value) {
    await initAuth();
  }

  // Если пользователь авторизован, проверяем подписку автоматически
  if (user.value) {
    await checkSubscription(false); // Без alert для автоматической проверки

    // Устанавливаем периодическую проверку каждые 5 минут
    subscriptionCheckInterval.value = setInterval(async () => {
      if (user.value) {
        await checkSubscription(false); // Без alert для автоматической проверки
      } else {
        // Если пользователь вышел, останавливаем проверку
        if (subscriptionCheckInterval.value) {
          clearInterval(subscriptionCheckInterval.value);
          subscriptionCheckInterval.value = null;
        }
      }
    }, 5 * 60 * 1000); // 5 минут
  }

  // Загружаем UI компоненты
  await loadUiComponents();
});

onUnmounted(() => {
  if (subscriptionCheckInterval.value) {
    clearInterval(subscriptionCheckInterval.value);
    subscriptionCheckInterval.value = null;
  }
});
</script>

<style lang="scss" scoped>
.content-page {
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
  margin-bottom: 64px;

  .main-title {
    font-size: 3rem;
    font-weight: 700;
    margin: 0 0 16px 0;
    animation: fadeInUp 0.8s ease forwards;
  }

  .subtitle {
    font-size: 1.2rem;
    color: var(--color-text-secondary);
    margin: 0;
    animation: fadeInUp 0.8s ease forwards 0.2s;
    opacity: 0;
  }
}

// Стили для проверки подписки
.subscription-check {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.subscription-card {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 48px;
  text-align: center;
  max-width: 600px;
  box-shadow: var(--card-shadow);

  h2 {
    font-size: 2rem;
    margin: 24px 0 16px 0;
    color: var(--color-text);
  }

  p {
    color: var(--color-text-secondary);
    font-size: 1.1rem;
    margin-bottom: 32px;
  }
}

.subscription-icon {
  color: var(--color-accent);
  margin-bottom: 16px;
}

.channel-info {
  margin: 32px 0;
}

.channel-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;

  .channel-icon {
    font-size: 2rem;
    color: #0088cc;
  }

  .channel-details {
    text-align: left;

    h3 {
      margin: 0 0 4px 0;
      color: var(--color-text);
    }

    p {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: 0.9rem;
    }
  }
}

.check-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 24px 0;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.subscription-steps {
  text-align: left;
  margin-top: 32px;

  h3 {
    margin-bottom: 16px;
    color: var(--color-text);
  }

  ol {
    color: var(--color-text-secondary);
    line-height: 1.8;

    li {
      margin-bottom: 8px;
    }

    strong {
      color: var(--color-accent);
    }
  }
}

// Стили для эксклюзивного контента
.exclusive-content {
  animation: fadeInUp 0.8s ease forwards;
}

.welcome-message {
  text-align: center;
  margin-bottom: 64px;
  padding: 48px;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.1) 0%,
    rgba(118, 75, 162, 0.1) 100%
  );
  border-radius: 20px;
  border: 1px solid var(--border-color);

  h2 {
    font-size: 2.5rem;
    margin: 0 0 16px 0;
    color: var(--color-text);
  }

  p {
    font-size: 1.2rem;
    color: var(--color-text-secondary);
    margin: 0;
  }
}

.content-sections {
  display: grid;
  gap: 64px;
}

.content-section {
  h3 {
    font-size: 2rem;
    margin: 0 0 32px 0;
    text-align: center;
  }
}

// Стили для туториалов
.tutorials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
}

.tutorial-card {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  box-shadow: var(--card-shadow);
  text-decoration: none;
  display: block;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--card-shadow-hover);
    border-color: var(--color-accent);
  }

  .tutorial-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h4 {
      margin: 0;
      font-size: 1.2rem;
      color: var(--color-text);
    }
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

  p {
    color: var(--color-text-secondary);
    margin: 0 0 16px 0;
    line-height: 1.6;
  }

  .tutorial-meta {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
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
}

// Стили для материалов
.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.material-card {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: var(--card-shadow);
  text-decoration: none;
  display: block;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--card-shadow-hover);
    border-color: var(--color-accent);
  }

  h4 {
    font-size: 1.3rem;
    margin: 0 0 12px 0;
    color: var(--color-text);
  }

  p {
    color: var(--color-text-secondary);
    margin: 0 0 20px 0;
    line-height: 1.6;
  }

  .material-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
}

// Стили для UI компонентов
.ui-components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
}

.ui-component-card {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
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
  overflow: hidden;
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
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.component-demo-frame {
  width: 100%;
  height: 100%;
  border: 0;
  background: white;
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
  margin-bottom: 16px;
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

.component-button {
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

// Стили для CTA карточки компонента
.cta-component-card {
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.1),
    rgba(118, 75, 162, 0.1)
  );
  border: 2px dashed var(--color-accent) !important;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(102, 126, 234, 0.1),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover {
    background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.15),
      rgba(118, 75, 162, 0.15)
    );
    transform: translateY(-6px) scale(1.02);

    &:before {
      left: 100%;
    }

    .cta-arrow {
      transform: translateX(10px) scale(1.2);
    }

    .cta-icon {
      transform: scale(1.1) rotate(5deg);
    }
  }
}

.cta-component-content {
  text-align: center;
  padding: 40px 20px;
  position: relative;
  z-index: 1;
}

.cta-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
  transition: all 0.3s ease;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
}

.cta-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: var(--color-text);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.cta-description {
  color: var(--color-text-secondary);
  margin: 0 0 24px 0;
  line-height: 1.6;
  font-size: 1.05rem;
}

.cta-stats-badge {
  display: inline-block;
  padding: 8px 20px;
  background: var(--gradient-primary);
  color: white;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.cta-arrow {
  font-size: 2rem;
  color: var(--color-accent);
  transition: all 0.3s ease;
  font-weight: bold;
}

.view-count {
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

// Анимации
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

// Адаптивность
@media (max-width: 768px) {
  .header-section .main-title {
    font-size: 2rem;
  }

  .subscription-card {
    padding: 32px 24px;
  }

  .tutorials-grid,
  .materials-grid {
    grid-template-columns: 1fr;
  }

  .projects-grid {
    grid-template-columns: 1fr;
  }
}

// Hover эффекты для карточек
.material-card {
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  }
}

.tutorial-card {
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  }
}
</style>
