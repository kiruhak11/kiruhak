<template>
  <div class="mobile-header">
    <NuxtLink to="/" class="mobile-brand" aria-label="Портфолио Кирилла Коваленко — главная">
      <span class="brand-mark" aria-hidden="true">К</span>
      <span class="brand-copy">
        <strong>Кирилл</strong>
        <small>WEB · PRODUCT</small>
      </span>
    </NuxtLink>

    <div class="header-actions">
      <NuxtLink to="/contact" class="header-cta" aria-label="Обсудить проект">
        <span>Контакт</span>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4.5 10h10m-4-4 4 4-4 4" />
        </svg>
      </NuxtLink>

      <button
        ref="trigger"
        class="menu-trigger"
        type="button"
        :aria-expanded="isOpen"
        aria-controls="mobile-navigation"
        :aria-label="isOpen ? 'Закрыть меню' : 'Открыть меню'"
        @click="toggleMenu"
      >
        <span class="trigger-halo" aria-hidden="true"></span>
        <span class="burger-lines" :class="{ open: isOpen }" aria-hidden="true">
          <i></i><i></i><i></i>
        </span>
      </button>
    </div>

    <Teleport to="body">
      <Transition name="mobile-menu">
        <div
          v-show="isOpen"
          id="mobile-navigation"
          class="mobile-menu-backdrop"
          @click.self="closeMenu(true)"
        >
          <section
            ref="menuPanel"
            class="mobile-menu-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
            @click.stop
          >
            <div class="menu-sheet">
            <div class="menu-topline">
              <span class="menu-kicker">ПОРТФОЛИО <b>/</b> НАВИГАЦИЯ</span>
              <div class="menu-top-actions">
                <ThemeToggle />
                <button
                  ref="closeButton"
                  class="close-button"
                  type="button"
                  aria-label="Закрыть меню"
                  @click="closeMenu(true)"
                >
                  <span></span><span></span>
                </button>
              </div>
            </div>

            <div class="menu-intro">
              <h2 id="mobile-menu-title">Навигация</h2>
              <p>Выберите раздел портфолио.</p>
            </div>

            <nav class="menu-links" aria-label="Разделы сайта" @click="handleNavigationClick">
              <NuxtLink
                v-for="(item, index) in navItems"
                :key="item.to"
                :to="item.to"
                class="menu-link"
                :class="{ active: isActive(item.to) }"
                :aria-current="isActive(item.to) ? 'page' : undefined"
                :style="{ '--link-index': index }"
              >
                <span class="menu-link-number">0{{ index + 1 }}</span>
                <span class="menu-link-copy">
                  <strong>{{ item.label }}</strong>
                  <small>{{ item.hint }}</small>
                </span>
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M4 10h11m-4-4 4 4-4 4" />
                </svg>
              </NuxtLink>
            </nav>

            <div v-if="isAuthenticated" class="account-card">
              <div class="account-summary">
                <div class="account-avatar">
                  <img v-if="user?.photoUrl" :src="user.photoUrl" :alt="user?.firstName || 'Профиль'" />
                  <span v-else>{{ initials }}</span>
                </div>
                <div class="account-copy">
                  <strong>{{ user?.firstName }} {{ user?.lastName }}</strong>
                  <small>@{{ user?.username || 'аккаунт' }} · {{ formattedBalance }}</small>
                </div>
                <NuxtLink to="/content" class="account-open" aria-label="Открыть кабинет" @click="handleNavigationClick">
                  <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 15 15 5M6 5h9v9" /></svg>
                </NuxtLink>
              </div>
              <div class="account-actions">
                <NuxtLink to="/analytics" @click="handleNavigationClick">Аналитика</NuxtLink>
                <NuxtLink to="/content" @click="handleNavigationClick">Контент платформы</NuxtLink>
                <button type="button" @click="openTopUpModal">Пополнить баланс</button>
                <button type="button" @click="openEditProfile">Изменить профиль</button>
                <NuxtLink v-if="isAdmin" to="/admin/projects" @click="handleNavigationClick">Админ-панель</NuxtLink>
                <button type="button" class="logout-action" @click="handleLogout">Выйти</button>
              </div>
            </div>

            <NuxtLink v-else to="/login" class="login-card" @click="handleNavigationClick">
              <span class="login-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5m5 5H3m9-9h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></svg>
              </span>
              <span><strong>Войти в платформу</strong><small>Аналитика и материалы аккаунта</small></span>
              <svg class="login-arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>
            </NuxtLink>

            <div class="menu-footer">
              <span>WEB · FULLSTACK · PRODUCTION</span>
              <span>КИРИЛЛ КОВАЛЕНКО</span>
            </div>
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>

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
import { publicNavigation } from "~/constants/public-navigation";

const route = useRoute();
const router = useRouter();
const {
  user,
  isAuthenticated,
  isAdmin,
  initAuth,
  formattedBalance,
  logout,
  refreshUser,
} = useAuth();

const isOpen = ref(false);
const showEditForm = ref(false);
const showTopUpForm = ref(false);
const trigger = ref<HTMLButtonElement | null>(null);
const closeButton = ref<HTMLButtonElement | null>(null);
const menuPanel = ref<HTMLElement | null>(null);
let mobileMediaQuery: MediaQueryList | null = null;

const navItems = publicNavigation;

const initials = computed(() => {
  const first = user.value?.firstName?.charAt(0) || "K";
  const last = user.value?.lastName?.charAt(0) || "";
  return `${first}${last}`.toUpperCase();
});

const isActive = (to: string) =>
  to === "/" ? route.path === "/" : route.path === to || route.path.startsWith(`${to}/`);

const closeMenu = (restoreFocus = false) => {
  isOpen.value = false;
  if (restoreFocus) nextTick(() => trigger.value?.focus());
};

const toggleMenu = () => { isOpen.value = !isOpen.value; };

const handleNavigationClick = (event: MouseEvent) => {
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
  if (!link) return;

  const target = new URL(link.href);
  if (`${target.pathname}${target.search}${target.hash}` === route.fullPath) {
    closeMenu(true);
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeMenu(true);
    return;
  }

  if (event.key !== "Tab" || !menuPanel.value) return;
  const focusable: HTMLElement[] = Array.from(
    menuPanel.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => element.offsetParent !== null);
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

const openTopUpModal = () => {
  closeMenu();
  showTopUpForm.value = true;
};

const openEditProfile = () => {
  closeMenu();
  showEditForm.value = true;
};

const handleLogout = async () => {
  await logout();
  closeMenu();
  await router.push("/login");
};

const handleProfileSaved = async () => {
  await refreshUser();
  showEditForm.value = false;
};

const handleBalanceUpdated = () => {
  showTopUpForm.value = false;
};

watch(isOpen, async (open: boolean) => {
  if (!import.meta.client) return;

  document.body.classList.toggle("no-scroll", open);
  if (open) {
    window.addEventListener("keydown", handleKeydown);
    await nextTick();
    closeButton.value?.focus();
  } else {
    window.removeEventListener("keydown", handleKeydown);
  }
});

watch(() => route.fullPath, () => {
  const wasOpen = isOpen.value;
  closeMenu(wasOpen);
});

const handleViewportChange = async (event: MediaQueryListEvent) => {
  if (!event.matches) {
    closeMenu();
    await nextTick();
    document.querySelector<HTMLElement>(".desktop-navigation a")?.focus();
    return;
  }
  await initAuth();
  if (isAuthenticated.value) await refreshUser();
};

onMounted(async () => {
  mobileMediaQuery = window.matchMedia("(max-width: 900px)");
  mobileMediaQuery.addEventListener("change", handleViewportChange);
  if (mobileMediaQuery.matches) {
    await initAuth();
    if (isAuthenticated.value) await refreshUser();
  }
});

onBeforeUnmount(() => {
  document.body.classList.remove("no-scroll");
  window.removeEventListener("keydown", handleKeydown);
  mobileMediaQuery?.removeEventListener("change", handleViewportChange);
});
</script>



<style scoped lang="scss">
.mobile-header,
.mobile-header * { font-family: var(--portfolio-font-sans); }

.mobile-header {
  display: flex;
  width: 100%;
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 9px;
  overflow: visible;
  border: 1px solid var(--portfolio-border);
  border-radius: var(--portfolio-radius-md);
  background: color-mix(in srgb, var(--portfolio-bg-elevated) 92%, transparent);
  box-shadow: var(--portfolio-shadow-soft);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
}

.mobile-brand {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  color: var(--portfolio-text);
  text-decoration: none;
}

.brand-mark {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  place-items: center;
  border: 1px solid var(--portfolio-border);
  border-radius: 11px;
  background: var(--portfolio-surface-hover);
  color: var(--portfolio-accent);
  font-size: 1rem;
  font-weight: 700;
}

.brand-copy { display: grid; gap: 3px; white-space: nowrap; }
.brand-copy strong { font-size: 0.8rem; font-weight: 680; letter-spacing: -0.02em; }
.brand-copy small { color: var(--portfolio-text-muted); font-size: 0.56rem; font-weight: 650; letter-spacing: 0.1em; }

.header-actions,
.menu-top-actions { display: flex; flex: 0 0 auto; align-items: center; gap: 8px; }

.header-cta {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 10px;
  border: 1px solid var(--portfolio-accent);
  border-radius: var(--portfolio-radius-sm);
  background: var(--portfolio-accent);
  color: var(--portfolio-accent-contrast);
  font-size: 0.75rem;
  font-weight: 650;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 160ms ease, transform 160ms ease;
}

.header-cta:hover { transform: translateY(-1px); background: var(--portfolio-accent-hover); }
.header-cta:active { transform: translateY(0); }
.header-cta svg,.menu-link svg,.account-open svg,.login-icon svg,.login-arrow { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.7; }

.menu-trigger {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  place-items: center;
  border: 1px solid var(--portfolio-border);
  border-radius: var(--portfolio-radius-sm);
  background: var(--portfolio-surface);
  color: var(--portfolio-text);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: border-color 160ms ease, background-color 160ms ease;
}

.menu-trigger:hover,
.menu-trigger[aria-expanded="true"] { border-color: var(--portfolio-border-hover); background: var(--portfolio-surface-hover); }
.trigger-halo { display: none; }
.burger-lines { display: flex; width: 19px; flex-direction: column; align-items: flex-end; gap: 5px; }
.burger-lines i { display: block; width: 19px; height: 1.5px; border-radius: var(--portfolio-radius-pill); background: currentColor; transition: width 180ms ease, transform 180ms ease, opacity 120ms ease; }
.burger-lines i:nth-child(2) { width: 13px; }
.burger-lines.open { align-items: center; gap: 0; }
.burger-lines.open i:nth-child(1) { transform: translateY(1px) rotate(45deg); }
.burger-lines.open i:nth-child(2) { width: 19px; transform: rotate(-45deg); }
.burger-lines.open i:nth-child(3) { width: 0; opacity: 0; }

.menu-trigger:focus-visible,
.close-button:focus-visible,
.menu-link:focus-visible,
.header-cta:focus-visible,
.login-card:focus-visible,
.account-open:focus-visible { outline: 2px solid var(--portfolio-accent); outline-offset: 3px; }

.mobile-menu-backdrop {
  position: fixed;
  z-index: 1200;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 12px 12px calc(12px + env(safe-area-inset-bottom));
  background: rgba(6, 10, 8, 0.62);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}

.mobile-menu-panel {
  position: fixed;
  z-index: 1;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
  clip-path: none;
  transition: none;
  will-change: auto;
  pointer-events: none;
}

.menu-sheet {
  position: relative;
  display: flex;
  width: min(calc(100vw - 24px), 480px);
  max-height: calc(100vh - 24px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  max-height: calc(100dvh - 24px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  flex-direction: column;
  gap: 18px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  margin-bottom: calc(12px + env(safe-area-inset-bottom));
  padding: 20px;
  border: 1px solid var(--portfolio-border);
  border-radius: var(--portfolio-radius-lg);
  background: var(--portfolio-bg-elevated);
  box-shadow: var(--portfolio-shadow);
  color: var(--portfolio-text);
  pointer-events: auto;
}

.menu-sheet::before { content: none; }

.menu-topline { display: flex; min-height: 40px; align-items: center; justify-content: space-between; gap: 10px; }
.menu-kicker { color: var(--portfolio-text-muted); font-size: var(--portfolio-label); font-weight: 650; letter-spacing: 0.1em; }
.menu-kicker b { color: var(--portfolio-accent); }
.menu-top-actions { gap: 8px; }

.menu-top-actions :deep(.theme-toggle),
.close-button {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid var(--portfolio-border);
  border-radius: var(--portfolio-radius-sm);
  background: var(--portfolio-surface);
  color: var(--portfolio-text-secondary);
  box-shadow: none;
}

.menu-top-actions :deep(.theme-toggle:hover) { transform: none; box-shadow: none; }
.close-button { position: relative; cursor: pointer; }
.close-button span { position: absolute; width: 16px; height: 1.5px; border-radius: 9px; background: currentColor; }
.close-button span:first-child { transform: rotate(45deg); }
.close-button span:last-child { transform: rotate(-45deg); }

.menu-intro h2 { margin: 0; color: var(--portfolio-text); font-size: clamp(1.75rem, 8vw, 2.25rem); font-weight: 650; letter-spacing: -0.05em; line-height: 1.05; }
.menu-intro h2 span {
  color: var(--portfolio-accent);
  background: none;
  background-clip: initial;
  -webkit-text-fill-color: currentColor;
  -webkit-background-clip: initial;
}
.menu-intro p { margin: 8px 0 0; color: var(--portfolio-text-secondary); font-size: 0.9rem; line-height: 1.5; }
.menu-links { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }

.menu-link {
  display: grid;
  min-width: 0;
  min-height: 74px;
  grid-template-columns: 22px minmax(0, 1fr) 17px;
  align-items: center;
  gap: 7px;
  padding: 10px;
  border: 1px solid var(--portfolio-border);
  border-radius: var(--portfolio-radius-md);
  background: var(--portfolio-surface);
  color: var(--portfolio-text);
  text-decoration: none;
  animation: none;
  transition: border-color 160ms ease, background-color 160ms ease;
}

.menu-link:nth-child(5) { grid-column: 1 / -1; }
.menu-link:hover,.menu-link.active { transform: none; border-color: var(--portfolio-border-hover); background: var(--portfolio-surface-hover); }
.menu-link-number { align-self: start; padding-top: 2px; color: var(--portfolio-accent); font-family: var(--portfolio-font-mono) !important; font-size: 0.65rem; }
.menu-link-copy { display: grid; min-width: 0; gap: 4px; }
.menu-link-copy strong { overflow: hidden; font-size: 0.875rem; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.menu-link-copy small { overflow: hidden; color: var(--portfolio-text-muted); font-size: 0.7rem; text-overflow: ellipsis; white-space: nowrap; }
.menu-link > svg { color: var(--portfolio-text-muted); }

.login-card,.account-card { border: 1px solid var(--portfolio-border); border-radius: var(--portfolio-radius-md); background: var(--portfolio-surface); }
.login-card { display: flex; min-height: 64px; align-items: center; gap: 10px; padding: 10px 12px; color: var(--portfolio-text); text-decoration: none; }
.login-icon,.account-avatar { display: grid; width: 40px; height: 40px; flex: 0 0 40px; place-items: center; overflow: hidden; border-radius: 11px; background: var(--portfolio-surface-hover); color: var(--portfolio-accent); }
.login-card > span:nth-child(2),.account-copy { display: grid; min-width: 0; gap: 4px; }
.login-card strong,.account-copy strong { font-size: 0.8rem; }
.login-card small,.account-copy small { overflow: hidden; color: var(--portfolio-text-muted); font-size: 0.68rem; text-overflow: ellipsis; white-space: nowrap; }
.login-arrow { margin-left: auto; color: var(--portfolio-text-muted); }
.account-card { padding: 12px; }
.account-summary { display: flex; align-items: center; gap: 10px; }
.account-avatar img { width: 100%; height: 100%; object-fit: cover; }
.account-copy { flex: 1; }
.account-open { display: grid; width: 36px; height: 36px; flex: 0 0 36px; place-items: center; border: 1px solid var(--portfolio-border); border-radius: 10px; color: var(--portfolio-text-secondary); }
.account-actions { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 11px; }
.account-actions button,.account-actions a { display: inline-flex; min-height: 40px; align-items: center; padding: 0 10px; border: 1px solid var(--portfolio-border); border-radius: 10px; background: var(--portfolio-surface); color: var(--portfolio-text-secondary); font: inherit; font-size: 0.72rem; text-decoration: none; cursor: pointer; }
.account-actions .logout-action { color: var(--portfolio-error); }
.menu-footer { display: flex; min-height: 22px; align-items: center; justify-content: space-between; gap: 8px; color: var(--portfolio-text-muted); font-size: 0.625rem; font-weight: 600; letter-spacing: 0.05em; }

.mobile-menu-enter-active,.mobile-menu-leave-active { transition: opacity 220ms ease; }
.mobile-menu-enter-active .menu-sheet,.mobile-menu-leave-active .menu-sheet { transition: transform 220ms cubic-bezier(0.2, 0.75, 0.3, 1); }
.mobile-menu-enter-from,.mobile-menu-leave-to { opacity: 0; }
.mobile-menu-enter-from .menu-sheet,.mobile-menu-leave-to .menu-sheet { transform: translateY(14px); }

@media (max-width: 360px) {
  .mobile-header { min-height: 60px; padding: 6px 7px; }
  .brand-mark { width: 33px; height: 33px; flex-basis: 33px; }
  .brand-copy strong { font-size: 0.75rem; }
  .brand-copy small { font-size: 0.52rem; }
  .header-actions { gap: 6px; }
  .header-cta { min-height: 44px; padding: 0 8px; font-size: 0.7rem; }
  .menu-trigger { width: 44px; height: 44px; flex-basis: 44px; }
  .menu-sheet { gap: 14px; padding: 16px; }
  .menu-link { min-height: 70px; grid-template-columns: 18px minmax(0, 1fr) 16px; gap: 5px; padding: 8px; }
  .menu-link-copy strong { font-size: 0.8rem; }
  .menu-link-copy small { font-size: 0.62rem; }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-header *, .mobile-menu-backdrop, .menu-sheet { transition-duration: 0.01ms !important; animation: none !important; scroll-behavior: auto !important; }
}
</style>
