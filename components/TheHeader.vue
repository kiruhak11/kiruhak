<template>
  <header class="header container" :class="{ 'is-scrolled': isScrolled }">
    <NuxtLink class="brand" to="/" aria-label="Кирилл Коваленко — главная">
      <span class="brand-mark" aria-hidden="true">К</span>
      <span class="brand-copy">
        <strong>Кирилл Коваленко</strong>
        <small>WEB DEVELOPER</small>
      </span>
    </NuxtLink>

    <nav class="desktop-navigation" aria-label="Основная навигация">
      <ul>
        <li v-for="item in publicNavigation" :key="item.to">
          <NuxtLink :to="item.to" :aria-current="isActive(item.to) ? 'page' : undefined">
            {{ item.label }}
          </NuxtLink>
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
    <div class="header-actions">
      <a class="header-github" :href="publicContact.github.href" target="_blank" rel="noopener noreferrer">
        GitHub
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 4.5h8v8m-.5-7.5-8 8" /></svg>
      </a>
      <ThemeToggle class="desktop-theme" />
      <NuxtLink class="header-contact-cta" to="/contact">Обсудить проект</NuxtLink>
    </div>
    <HamburgerMenu class="mobile-navigation" />
  </header>
</template>

<script lang="ts" setup>
import { publicNavigation } from "~/constants/public-navigation";
import { publicContact } from "~/constants/public-contact";

const route = useRoute();
const isScrolled = ref(false);
const handleScroll = () => { isScrolled.value = window.scrollY > 24; };
const isActive = (to: string) =>
  to === "/" ? route.path === "/" : route.path === to || route.path.startsWith(`${to}/`);

const {
  user,
  isAuthenticated,
  initAuth,
  refreshUser,
} = useAuth();

onMounted(async () => {
  handleScroll();
  window.addEventListener("scroll", handleScroll, { passive: true });
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
onBeforeUnmount(() => window.removeEventListener("scroll", handleScroll));
</script>

<style lang="scss" scoped>
.header {
  position: sticky;
  top: 10px;
  z-index: 20;
  display: flex;
  width: min(var(--portfolio-content-width), calc(100% - 2 * var(--portfolio-gutter)));
  min-height: 68px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin: 10px auto 0;
  padding: 10px 18px;
  border: 1px solid var(--portfolio-border);
  border-radius: var(--portfolio-radius-lg);
  background: color-mix(in srgb, var(--portfolio-bg-elevated) 88%, transparent);
  color: var(--portfolio-text);
  box-shadow: var(--portfolio-shadow-soft);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  transition: background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.header.is-scrolled {
  border-color: var(--portfolio-border-hover);
  background: var(--portfolio-bg-elevated);
  box-shadow: var(--portfolio-shadow);
}

.header,
.header * { font-family: var(--portfolio-font-sans); }

.brand {
  display: inline-flex;
  min-width: max-content;
  align-items: center;
  gap: 10px;
  color: inherit;
  text-decoration: none;
}

.brand-mark {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border: 1px solid var(--portfolio-border);
  border-radius: var(--portfolio-radius-sm);
  background: var(--portfolio-surface-hover);
  color: var(--portfolio-accent);
  font-size: 1rem;
  font-weight: 750;
}

.brand-copy { display: grid; gap: 3px; }
.brand-copy strong { font-size: 0.9rem; font-weight: 650; letter-spacing: -0.02em; }
.brand-copy small { color: var(--portfolio-text-muted); font-size: 0.625rem; font-weight: 650; letter-spacing: 0.11em; }

.desktop-navigation ul {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.desktop-navigation li { position: relative; }

.desktop-navigation > ul > li > a {
  display: inline-flex;
  min-height: var(--portfolio-control-compact);
  align-items: center;
  padding: 0 13px;
  border-radius: var(--portfolio-radius-sm);
  color: var(--portfolio-text-secondary);
  font-size: 0.9rem;
  font-weight: 550;
  text-decoration: none;
  transition: color 160ms ease, background-color 160ms ease;
}

.desktop-navigation > ul > li > a:hover,
.desktop-navigation > ul > li > a[aria-current="page"] {
  background: var(--portfolio-surface-hover);
  color: var(--portfolio-text);
}

.header-actions { display: flex; flex: 0 0 auto; align-items: center; gap: 12px; }

.header-github {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--portfolio-text-secondary);
  font-size: 0.875rem;
  text-decoration: none;
  transition: color 160ms ease;
}

.header-github:hover { color: var(--portfolio-text); }
.header-github svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }

.header-contact-cta {
  display: inline-flex;
  min-height: var(--portfolio-control-compact);
  align-items: center;
  justify-content: center;
  padding: 0 15px;
  border: 1px solid var(--portfolio-accent);
  border-radius: var(--portfolio-radius-sm);
  background: var(--portfolio-accent);
  color: var(--portfolio-accent-contrast);
  font-size: 0.875rem;
  font-weight: 650;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 160ms ease, transform 160ms ease;
}

.header-contact-cta:hover { transform: translateY(-1px); background: var(--portfolio-accent-hover); }
.header-contact-cta:active { transform: translateY(0); }
.mobile-navigation { display: none; }

.header :deep(.theme-toggle) {
  width: var(--portfolio-control-compact);
  height: var(--portfolio-control-compact);
  border: 1px solid var(--portfolio-border);
  border-radius: var(--portfolio-radius-sm);
  background: transparent;
  box-shadow: none;
  color: var(--portfolio-text-secondary);
}

.header :deep(.theme-toggle:hover) {
  transform: none;
  border-color: var(--portfolio-border-hover);
  background: var(--portfolio-surface-hover);
  box-shadow: none;
}

.desktop-navigation a:focus-visible,
.brand:focus-visible,
.header-github:focus-visible,
.header-contact-cta:focus-visible { outline: 2px solid var(--portfolio-accent); outline-offset: 3px; }

.user-menu .user-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border: 0;
  border-radius: var(--portfolio-radius-sm);
  background: transparent;
  color: var(--portfolio-text);
  cursor: pointer;
  font: inherit;
}

.user-button:hover { background: var(--portfolio-surface-hover); }
.user-avatar { display: grid; width: 30px; height: 30px; place-items: center; overflow: hidden; border-radius: 50%; background: var(--portfolio-accent); color: var(--portfolio-accent-contrast); }
.avatar-image { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder { font-size: 0.75rem; font-weight: 700; }
.user-name { font-size: 0.875rem; }
.dropdown-icon { transition: transform 160ms ease; }
.user-button[aria-expanded="true"] .dropdown-icon { transform: rotate(180deg); }
.profile-dropdown { position: absolute; top: calc(100% + 8px); right: 0; z-index: 30; min-width: 280px; }

@media (max-width: 900px) {
  .header {
    top: 8px;
    min-height: 0;
    margin-top: 8px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }

  .brand,
  .desktop-navigation,
  .header-actions { display: none; }

  .mobile-navigation { display: flex; width: 100%; }
}

@media (min-width: 901px) {
  .mobile-navigation { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .header,
  .header * { scroll-behavior: auto; transition-duration: 0.01ms !important; }
}
</style>
