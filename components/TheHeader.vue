<template>
  <header class="header container">
    <div class="logo" v-if="!isMobile">
      <LoaderIcon />
      <div class="logo__text">
        <NuxtLink to="/">
          <h1>K-Studio</h1>
        </NuxtLink>
      </div>
    </div>

    <nav v-if="!isMobile">
      <ul>
        <li><NuxtLink to="/projects">Проекты</NuxtLink></li>
        <li><NuxtLink to="/analytics">Бриф</NuxtLink></li>
        <li><NuxtLink to="/content">Контент</NuxtLink></li>
        <li><NuxtLink to="/contact">Контакты</NuxtLink></li>
        <li v-if="!isAuthenticated"><NuxtLink to="/login">Войти</NuxtLink></li>
        <li v-else class="user-menu">
          <button @click="showProfile = !showProfile" class="user-button">
            <div class="user-avatar">
              <img
                v-if="user?.photoUrl"
                :src="user.photoUrl"
                :alt="user?.firstName"
                class="avatar-image"
              />
              <div v-else class="avatar-placeholder">
                {{ user?.firstName?.charAt(0) }}{{ user?.lastName?.charAt(0) }}
              </div>
            </div>
            <span class="user-name">{{ user?.firstName }}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="dropdown-icon"
            >
              <polyline
                points="6,9 12,15 18,9"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <div v-if="showProfile" class="profile-dropdown">
            <UserProfile />
          </div>
        </li>
      </ul>
    </nav>
    <ThemeToggle v-if="!isMobile" />
    <HamburgerMenu v-else />
  </header>
</template>

<script lang="ts" setup>
const { isMobile } = useDevice();
const {
  user,
  token,
  isAuthenticated,
  logout,
  formattedBalance,
  initAuth,
  refreshUser,
} = useAuth();
const router = useRouter();

// Инициализируем аутентификацию
onMounted(async () => {
  await initAuth();
  console.log("🔐 Analytics: Состояние аутентификации:", {
    isAuthenticated: isAuthenticated.value,
    hasToken: !!token.value,
    user: user.value,
  });

  // Обновляем данные пользователя с сервера при загрузке страницы
  if (isAuthenticated.value) {
    await refreshUser();
    console.log("🔐 Analytics: Данные пользователя обновлены с сервера:", {
      balance: user.value?.balance,
      formattedBalance: formattedBalance.value,
    });
  }
});

const showProfile = ref(false);
console.log(user.value);
// Закрываем профиль при клике вне его
const closeProfile = () => {
  showProfile.value = false;
};

onMounted(() => {
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".user-menu")) {
      showProfile.value = false;
    }
  });
});
</script>

<style lang="scss" scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  border-radius: 0 0 16px 16px;
  background-color: var(--background-color);
  backdrop-filter: blur(10px);
  color: var(--color-text);
  box-shadow: 0 8px 16px var(--box-shadow-color);
  transition: background-color 0.3s, box-shadow 0.3s;

  &:hover {
    background-color: var(--background-color-hover);
    box-shadow: 0 12px 24px var(--box-shadow-color-hover);
  }
}

.logo {
  display: flex;
  align-items: center;
  padding: 0 16px;

  &__text {
    padding-left: 16px;

    h1 {
      font-size: 1.8rem;
      font-weight: bold;
      color: var(--color-text);
      text-transform: uppercase;
      letter-spacing: 1.5px;
      transition: color 0.3s;
    }

    h1:hover {
      color: var(--color-text-hover);
    }
  }
}

nav {
  ul {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    align-items: center;
  }

  li {
    margin: 0 16px;
    position: relative;

    &:hover::after,
    &.active::after {
      content: "";
      position: absolute;
      width: 100%;
      height: 2px;
      background-color: var(--color-accent);
      bottom: -4px;
      left: 0;
      transition: width 0.3s ease;
    }

    &::after {
      width: 0;
    }
  }

  a {
    color: var(--color-text);
    font-weight: bold;
    text-decoration: none;
    font-size: 1rem;
    text-transform: uppercase;
    transition: color 0.3s, letter-spacing 0.3s;

    &:hover {
      color: var(--color-text-hover);
      letter-spacing: 1px;
    }
  }

  .user-menu {
    position: relative;

    .user-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: transparent;
      border: none;
      color: var(--color-text);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 8px;
      transition: all 0.3s ease;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 1rem;

      &:hover {
        background: var(--background-color-hover);
      }

      .user-avatar {
        width: 32px;
        height: 32px;
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
          font-size: 0.9rem;
          font-weight: bold;
        }
      }

      .user-name {
        font-weight: 500;
      }

      .dropdown-icon {
        transition: transform 0.3s ease;
      }
    }

    .profile-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 0.5rem;
      z-index: 1000;
      min-width: 280px;
    }
  }
}
</style>
