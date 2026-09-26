<template>
  <div class="container">
    <!-- Гамбургер меню -->
    <div class="hamburger-menu">
      <div class="hamburger-menu-text">
        <NuxtLink to="/">
          <h1>K-Studio</h1>
        </NuxtLink>
      </div>
      <button
        class="hamburger-menu-icon"
        type="button"
        :aria-expanded="isOpen"
        aria-controls="mobile-navigation"
        :aria-label="isOpen ? 'Закрыть меню' : 'Открыть меню'"
        @click="toggleMenu"
      >
        <div class="bar" :class="{ open: isOpen }"></div>
        <div class="bar" :class="{ open: isOpen }"></div>
        <div class="bar" :class="{ open: isOpen }"></div>
      </button>
    </div>

    <!-- Мобильное меню -->
    <nav
      :class="{ 'mobile-nav-open': isOpen }"
      class="mobile-nav"
      id="mobile-navigation"
      @click="handleNavigationClick"
    >
      <ul>
        <div class="container">
          <div class="line"></div>
          <!-- Основные разделы -->
          <div class="nav-icons-row">
            <NuxtLink
              to="/"
              class="nav-icon-link"
              :class="{ active: $route.path === '/' }"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <polyline
                  points="9,22 9,12 15,12 15,22"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </NuxtLink>
            <NuxtLink
              to="/projects"
              class="nav-icon-link"
              :class="{ active: $route.path === '/projects' }"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </NuxtLink>
            <NuxtLink
              to="/contact"
              class="nav-icon-link"
              :class="{ active: $route.path === '/contact' }"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </NuxtLink>
            <NuxtLink
              to="/analytics"
              class="nav-icon-link"
              :class="{ active: $route.path === '/analytics' }"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 3v18h18"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </NuxtLink>
          </div>

          <!-- Аутентификация -->
          <div class="auth-section">
            <div class="line"></div>

            <!-- Если пользователь аутентифицирован -->
            <template v-if="isAuthenticated">
              <li class="user-info">
                <div class="user-avatar">
                  <img
                    v-if="user?.photoUrl"
                    :src="user.photoUrl"
                    :alt="user?.firstName"
                    class="avatar-image"
                  />
                  <div v-else class="avatar-placeholder">
                    {{ user?.firstName?.charAt(0)
                    }}{{ user?.lastName?.charAt(0) }}
                  </div>
                </div>
                <div class="user-details">
                  <h3>{{ user?.firstName }} {{ user?.lastName }}</h3>
                  <p class="username">@{{ user?.username || "user" }}</p>
                  <p class="balance">Баланс: {{ formattedBalance }}</p>
                </div>
              </li>

              <!-- Действия пользователя -->
              <li>
                <button @click="openTopUpModal" class="mobile-btn topup-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  Пополнить баланс
                </button>
              </li>

              <li>
                <button
                  @click="showEditForm = true"
                  class="mobile-btn edit-btn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  Редактировать профиль
                </button>
              </li>

              <!-- Админ панель -->
              <li v-if="isAdmin">
                <NuxtLink to="/admin/projects" class="mobile-btn admin-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  Админ панель
                </NuxtLink>
              </li>

              <li>
                <button @click="handleLogout" class="mobile-btn logout-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <polyline
                      points="16,17 21,12 16,7"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <line
                      x1="21"
                      y1="12"
                      x2="9"
                      y2="12"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  Выйти
                </button>
              </li>
            </template>

            <!-- Если пользователь не аутентифицирован -->
            <template v-else>
              <li>
                <NuxtLink to="/login" class="mobile-btn login-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <polyline
                      points="10,17 15,12 10,7"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <line
                      x1="15"
                      y1="12"
                      x2="3"
                      y2="12"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  Войти
                </NuxtLink>
              </li>
            </template>
          </div>

          <!-- Переключатель темы -->
          <li>
            <Switcher />
          </li>
        </div>
      </ul>
    </nav>

    <!-- Модалки -->
    <EditProfileModal
      :show="showEditForm"
      :user="user"
      @close="showEditForm = false"
      @saved="handleProfileSaved"
    />

    <TopUpBalanceModal
      :show="showTopUpForm"
      :formatted-balance="formattedBalance"
      @close="showTopUpForm = false"
      @balance-updated="handleBalanceUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from "vue";

const {
  user,
  isAuthenticated,
  isAdmin,
  initAuth,
  token,
  formattedBalance,
  logout,
  refreshUser,
} = useAuth();

const isOpen = ref(false);
const showEditForm = ref(false);
const showTopUpForm = ref(false);

const router = useRouter();
const route = useRoute();

const toggleMenu = () => {
  isOpen.value = !isOpen.value;
};

const handleNavigationClick = (event: MouseEvent) => {
  if ((event.target as HTMLElement).closest("a")) isOpen.value = false;
};

const handleLogout = () => {
  logout();
  router.push("/login");
  isOpen.value = false; // Закрываем меню после выхода
};

const openTopUpModal = () => {
  showTopUpForm.value = true;
  isOpen.value = false; // Закрываем меню при открытии модалки
};

const handleProfileSaved = () => {
  refreshUser();
  isOpen.value = false; // Закрываем меню после сохранения
};

const handleBalanceUpdated = () => {
  console.log("💰 Баланс обновлен в HamburgerMenu");
  isOpen.value = false; // Закрываем меню после обновления баланса
};

watch(isOpen, () => {
  if (isOpen.value) {
    document.body.classList.add("no-scroll");
  } else {
    document.body.classList.remove("no-scroll");
  }
});

watch(() => route.fullPath, () => {
  isOpen.value = false;
});

// Инициализируем аутентификацию
onMounted(async () => {
  console.log("🔐 UserProfile: Начало инициализации");
  await initAuth();
  console.log("🔐 UserProfile: Состояние аутентификации:", {
    isAuthenticated: isAuthenticated.value,
    hasToken: !!token.value,
    user: user.value,
  });

  // Обновляем данные пользователя с сервера при загрузке страницы
  if (isAuthenticated.value) {
    console.log("🔐 UserProfile: Обновление данных пользователя");
    await refreshUser();
    console.log("🔐 UserProfile: Данные пользователя обновлены с сервера:", {
      balance: user.value?.balance,
      formattedBalance: formattedBalance.value,
    });
  } else {
    console.log("🔐 UserProfile: Пользователь не аутентифицирован");
  }
});

onBeforeUnmount(() => {
  document.body.classList.remove("no-scroll");
});
</script>
<style lang="scss" scoped>
.hamburger-menu {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  min-height: 48px;
  gap: 12px;

  &-text a {
    text-decoration: none;
  }

  &-text h1 {
    margin: 0;
    font-size: 1.2rem;
    line-height: 1;
    letter-spacing: 0.04em;
  }

  &-icon {
    display: flex;
    flex-direction: column;
    margin-left: auto;
    cursor: pointer;
    z-index: 12;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    padding: 8px;
    border: 1px solid var(--border-color);
    border-radius: 14px;
    background: var(--background-color);
    color: var(--color-text);
  }
  .bar {
    width: 26px;
    height: 3px;
    background-color: var(--color-text);
    margin: 4px;
    transition: all 0.3s ease;
    border-radius: 99px;
  }

  .bar.open:nth-child(1) {
    transform: rotate(45deg) translate(15px);
    width: 30px;
  }

  .bar.open:nth-child(2) {
    opacity: 0;
  }

  .bar.open:nth-child(3) {
    transform: rotate(-45deg) translate(15px);
    width: 30px;
  }
}

.mobile {
  &-nav {
    position: absolute;
    top: calc(100% + 8px);
    left: 12px;
    right: 12px;
    z-index: 11;
    max-height: calc(100dvh - 88px - env(safe-area-inset-top));
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    opacity: 0;
    transform: translateY(-20px);
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
    background: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: 18px;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.22);
    &-open {
      opacity: 1;
      transform: translateY(0);
      visibility: visible;
      pointer-events: auto;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    li {
      margin: 16px 0;
      font-size: 32px;
    }

    .nav-icons-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 1rem;
      margin: 1rem 0;
      background: var(--background-color);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      box-shadow: var(--card-shadow);
      gap: 0.5rem;
    }

    .nav-icon-link {
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: var(--text-color);
      transition: all 0.3s ease;
      padding: 1rem;
      border-radius: 8px;
      min-width: 60px;
      min-height: 60px;
      position: relative;

      &.active {
        background: var(--gradient-primary);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);

        &::after {
          content: "";
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 6px;
          height: 6px;
          background: var(--accent-color);
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
        }
      }

      &:hover {
        background: var(--gradient-primary);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
      }

      svg {
        transition: all 0.3s ease;
      }

      &:hover svg,
      &.active svg {
        transform: scale(1.1);
      }
    }
  }
}

/* Дополнительные стили для блокировки скролла */
.no-scroll {
  overflow: hidden;
}

.logo {
  display: flex;
  align-items: center;

  h1 {
    color: var(--color-text);
    transition: color 0.3s;
  }
}

.line {
  display: flex;
  height: 1px;
  margin: 10px 0;
  width: 100vw;
  background-color: var(--color-text);
}

.auth-section {
  width: 100%;
  margin: 20px 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--background-color);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  margin: 1rem 0;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;

  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-placeholder {
    color: white;
    font-size: 1.2rem;
    font-weight: bold;
  }
}

.user-details {
  flex: 1;

  h3 {
    margin: 0 0 0.25rem 0;
    color: var(--text-color);
    font-size: 1rem;
  }

  .username {
    margin: 0 0 0.25rem 0;
    color: var(--text-muted);
    font-size: 0.8rem;
  }

  .balance {
    margin: 0;
    color: var(--accent-color);
    font-weight: 600;
    font-size: 0.8rem;
  }
}

.mobile-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  color: inherit;

  &.topup-btn {
    background: linear-gradient(135deg, #4caf50, #45a049);
    color: white;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    }
  }

  &.edit-btn {
    background: var(--gradient-primary);
    color: white;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
  }

  &.admin-btn {
    background: linear-gradient(135deg, #ff9800, #f57c00);
    color: white;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
    }
  }

  &.login-btn {
    background: var(--gradient-primary);
    color: white;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
  }

  &.logout-btn {
    background: transparent;
    color: var(--text-color);
    border: 1px solid var(--border-color);

    &:hover {
      background: var(--background-color-hover);
      border-color: var(--accent-color);
      color: var(--accent-color);
    }
  }
}

@media (max-width: 768px) {
  .container {
    position: relative;
  }

  .mobile-nav .container {
    width: 100%;
    max-width: none;
    padding: 8px 16px 18px;
    box-sizing: border-box;
  }

  .mobile-nav ul {
    align-items: stretch;
  }

  .mobile-nav li {
    margin: 8px 0;
    font-size: 16px;
  }

  .mobile-nav .nav-icons-row {
    margin: 4px 0 12px;
    padding: 8px;
  }

  .mobile-nav .nav-icon-link {
    min-width: 48px;
    min-height: 48px;
    padding: 8px;
  }

  .line {
    width: 100%;
  }
}
</style>
