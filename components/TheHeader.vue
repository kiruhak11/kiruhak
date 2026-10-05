<template>
  <header class="header container">
    <div class="logo">
      <LoaderIcon />
      <div class="logo__text">
        <NuxtLink to="/" aria-label="Портфолио Кирилла Коваленко — главная">
          <span class="logo-title">K-Studio</span>
        </NuxtLink>
      </div>
    </div>

    <nav class="desktop-navigation" aria-label="Основная навигация">
      <ul>
        <li v-for="item in publicNavigation" :key="item.to">
          <NuxtLink :to="item.to">{{ item.label }}</NuxtLink>
        </li>
        <li v-if="isAuthenticated" class="user-menu">
          <button
            @click="showProfile = !showProfile"
            class="user-button"
            :aria-expanded="showProfile"
            aria-controls="desktop-profile-menu"
          >
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
          <div v-if="showProfile" id="desktop-profile-menu" class="profile-dropdown">
            <UserProfile />
          </div>
        </li>
      </ul>
    </nav>
    <NuxtLink class="header-contact-cta" to="/contact">Обсудить проект</NuxtLink>
    <ThemeToggle class="desktop-theme" />
    <HamburgerMenu class="mobile-navigation" />
  </header>
</template>

<script lang="ts" setup>
import { publicNavigation } from "~/constants/public-navigation";

const {
  user,
  isAuthenticated,
  initAuth,
  refreshUser,
} = useAuth();

onMounted(async () => {
  await initAuth();
  if (isAuthenticated.value) {
    await refreshUser();
  }
});

const showProfile = ref(false);
const closeProfile = (event: MouseEvent) => {
  if (!(event.target as HTMLElement).closest(".user-menu")) {
    showProfile.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", closeProfile);
});

onBeforeUnmount(() => document.removeEventListener("click", closeProfile));
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

@media (max-width: 768px) {
  .header {
    padding: 8px 12px 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

.logo {
  display: flex;
  align-items: center;
  padding: 0 16px;

  &__text {
    padding-left: 16px;

    .logo-title {
      font-size: 1.8rem;
      font-weight: bold;
      color: var(--color-text);
      text-transform: uppercase;
      letter-spacing: 1.5px;
      transition: color 0.3s;
    }
  }
}

.desktop-navigation {
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

.logo a:hover .logo-title { color: var(--color-text-hover); }

.mobile-navigation { display: none; }

.header-contact-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--gradient-primary);
  color: #fff;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.header-contact-cta:focus-visible,
.desktop-navigation a:focus-visible,
.logo a:focus-visible { outline: 3px solid var(--color-accent); outline-offset: 3px; }

@media (max-width: 768px) {
  .logo,
  .desktop-navigation,
  .header-contact-cta,
  .desktop-theme { display: none; }

  .mobile-navigation { display: block; width: 100%; }
}

@media (min-width: 769px) {
  .mobile-navigation { display: none; }
}
</style>
