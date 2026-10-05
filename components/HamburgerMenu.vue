<template>
  <div class="mobile-header">
    <NuxtLink to="/" class="mobile-brand" aria-label="K-Studio — Главная">
      <span class="brand-mark" aria-hidden="true">
        <i></i><i></i><i></i><i></i>
      </span>
      <span class="brand-copy">
        <strong>K-STUDIO</strong>
        <small>WEB · DIGITAL · PRODUCT</small>
      </span>
    </NuxtLink>

    <div class="header-actions">
      <NuxtLink to="/contact" class="header-cta" aria-label="Обсудить проект">
        <span>Обсудить</span>
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
          v-if="isOpen"
          id="mobile-navigation"
          class="mobile-menu-backdrop"
          @click.self="closeMenu(true)"
        >
          <section
            ref="menuPanel"
            class="mobile-menu-panel"
            :style="genieOriginStyle"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
            @click.stop
          >
            <div class="menu-sheet">
            <div class="menu-topline">
              <span class="menu-kicker"><i></i> K-STUDIO <b>/</b> НАВИГАЦИЯ</span>
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
              <h2 id="mobile-menu-title">Куда<br /><span>двигаемся?</span></h2>
              <p>Выберите раздел — продолжим с нужного места.</p>
            </div>

            <nav class="menu-links" aria-label="Разделы сайта" @click="handleNavigationClick">
              <NuxtLink
                v-for="(item, index) in navItems"
                :key="item.to"
                :to="item.to"
                class="menu-link"
                :class="{ active: isActive(item.to) }"
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
                <NuxtLink to="/content" class="account-open" aria-label="Открыть кабинет" @click="closeMenu()">
                  <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 15 15 5M6 5h9v9" /></svg>
                </NuxtLink>
              </div>
              <div class="account-actions">
                <NuxtLink to="/analytics" @click="closeMenu()">Аналитика</NuxtLink>
                <NuxtLink to="/content" @click="closeMenu()">Контент платформы</NuxtLink>
                <button type="button" @click="openTopUpModal">Пополнить баланс</button>
                <button type="button" @click="openEditProfile">Изменить профиль</button>
                <NuxtLink v-if="isAdmin" to="/admin/projects" @click="closeMenu()">Админ-панель</NuxtLink>
                <button type="button" class="logout-action" @click="handleLogout">Выйти</button>
              </div>
            </div>

            <NuxtLink v-else to="/login" class="login-card" @click="closeMenu()">
              <span class="login-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5m5 5H3m9-9h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></svg>
              </span>
              <span><strong>Войти в платформу</strong><small>Аналитика и материалы аккаунта</small></span>
              <svg class="login-arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>
            </NuxtLink>

            <div class="menu-footer">
              <span><i></i> ОТКРЫТЫ К НОВЫМ ПРОЕКТАМ</span>
              <span>© K-STUDIO</span>
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
const route = useRoute();
const router = useRouter();
import { publicNavigation } from "~/constants/public-navigation";
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
const genieOriginStyle = ref<Record<string, string>>({
  "--genie-x": "calc(100% - 36px)",
  "--genie-y": "36px",
});

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

const toggleMenu = () => {
  if (!isOpen.value && trigger.value) {
    const rect = trigger.value.getBoundingClientRect();
    genieOriginStyle.value = {
      "--genie-x": `${rect.left + rect.width / 2}px`,
      "--genie-y": `${rect.top + rect.height / 2}px`,
    };
  }
  isOpen.value = !isOpen.value;
};

const handleNavigationClick = (event: MouseEvent) => {
  if ((event.target as HTMLElement).closest("a")) closeMenu();
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeMenu(true);
    return;
  }

  if (event.key !== "Tab" || !menuPanel.value) return;
  const focusable = Array.from(
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

watch(isOpen, async (open) => {
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

watch(() => route.fullPath, () => closeMenu());

const handleViewportChange = async (event: MediaQueryListEvent) => {
  if (!event.matches) {
    closeMenu();
    return;
  }
  await initAuth();
  if (isAuthenticated.value) await refreshUser();
};

onMounted(async () => {
  mobileMediaQuery = window.matchMedia("(max-width: 768px)");
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
.mobile-header {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  min-height: 68px;
  padding: 9px 10px 9px 14px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--border-color) 78%, #52a9d5 22%);
  border-radius: 22px;
  background:
    radial-gradient(ellipse at 8% -45%, rgba(33, 126, 178, 0.25), transparent 62%),
    radial-gradient(ellipse at 98% 140%, rgba(215, 138, 36, 0.17), transparent 50%),
    color-mix(in srgb, var(--background-color) 92%, #102c40 8%);
  box-shadow: 0 14px 38px rgba(2, 10, 18, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.07);
  -webkit-backdrop-filter: blur(18px);
  backdrop-filter: blur(18px);
}

.mobile-header::before {
  position: absolute;
  z-index: -1;
  top: -1px;
  left: 14%;
  width: 72%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(105, 190, 227, 0.6), rgba(235, 178, 91, 0.55), transparent);
  content: "";
}

.mobile-brand {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  color: var(--color-text);
  text-decoration: none;
}

.brand-mark {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  place-content: center;
  grid-template-columns: repeat(2, 8px);
  grid-template-rows: repeat(2, 8px);
  gap: 3px;
  border: 1px solid rgba(129, 190, 219, 0.25);
  border-radius: 13px;
  background: linear-gradient(145deg, rgba(53, 125, 164, 0.24), rgba(215, 138, 36, 0.12));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 14px rgba(5, 25, 39, 0.2);
}

.brand-mark i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #91c7df;
  box-shadow: 0 0 8px rgba(110, 187, 221, 0.4);
}

.brand-mark i:nth-child(2) { opacity: 0.76; }
.brand-mark i:nth-child(3) { opacity: 0.58; }
.brand-mark i:nth-child(4) { background: #e3a447; box-shadow: 0 0 10px rgba(227, 164, 71, 0.5); }

.brand-copy {
  display: grid;
  gap: 3px;
  white-space: nowrap;
}

.brand-copy strong {
  font-size: 0.82rem;
  line-height: 1;
  letter-spacing: 0.13em;
}

.brand-copy small {
  color: var(--color-text-secondary);
  font-size: 0.49rem;
  font-weight: 700;
  letter-spacing: 0.105em;
}

.header-actions,
.menu-top-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}

.header-cta {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 13px;
  border: 1px solid rgba(255, 212, 146, 0.42);
  border-radius: 14px;
  background: linear-gradient(112deg, #155c85, #1b78a7 58%, #bd761d);
  box-shadow: 0 7px 18px rgba(5, 49, 75, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.22);
  color: #fff;
  font-size: 0.76rem;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.header-cta:hover {
  transform: translateY(-1px);
  filter: saturate(1.15) brightness(1.08);
  box-shadow: 0 10px 22px rgba(5, 49, 75, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.header-cta svg,
.menu-link svg,
.account-open svg,
.login-icon svg,
.login-arrow {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.menu-trigger {
  position: relative;
  display: grid;
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(145, 193, 215, 0.28);
  border-radius: 16px;
  background: linear-gradient(150deg, rgba(25, 60, 82, 0.95), rgba(11, 27, 40, 0.98));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 6px 16px rgba(2, 12, 20, 0.26);
  color: var(--color-text);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.menu-trigger:focus-visible,
.close-button:focus-visible,
.menu-link:focus-visible,
.header-cta:focus-visible {
  outline: 3px solid rgba(227, 164, 71, 0.75);
  outline-offset: 3px;
}

.trigger-halo {
  position: absolute;
  inset: -45%;
  background: conic-gradient(from 130deg, transparent 0 48%, rgba(219, 157, 66, 0.2) 60%, transparent 73%);
  opacity: 0.68;
  transition: transform 0.45s ease;
}

.menu-trigger:hover .trigger-halo,
.menu-trigger[aria-expanded="true"] .trigger-halo {
  transform: rotate(100deg);
}

.burger-lines {
  position: relative;
  z-index: 1;
  display: flex;
  width: 21px;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.burger-lines i {
  display: block;
  width: 20px;
  height: 2px;
  border-radius: 99px;
  background: linear-gradient(90deg, #c3e3f0, #e0ad5c);
  box-shadow: 0 0 8px rgba(113, 183, 213, 0.26);
  transition: width 0.22s ease, transform 0.22s ease, opacity 0.16s ease;
}

.burger-lines i:nth-child(2) { width: 14px; }
.burger-lines.open { align-items: center; gap: 0; }
.burger-lines.open i:nth-child(1) { transform: translateY(2px) rotate(45deg); }
.burger-lines.open i:nth-child(2) { width: 20px; transform: rotate(-45deg); }
.burger-lines.open i:nth-child(3) { width: 0; opacity: 0; }

.mobile-menu-backdrop {
  position: fixed;
  z-index: 1200;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 12px 12px calc(10px + env(safe-area-inset-bottom));
  background: rgba(3, 10, 17, 0.72);
  -webkit-backdrop-filter: blur(15px);
  backdrop-filter: blur(15px);
}

.mobile-menu-panel {
  position: fixed;
  z-index: 1;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
  clip-path: ellipse(180% 150% at var(--genie-x) var(--genie-y));
  transition: clip-path 560ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: clip-path;
}

.menu-sheet {
  position: relative;
  isolation: isolate;
  display: flex;
  width: min(calc(100% - 24px), 540px);
  max-height: calc(100vh - 24px - env(safe-area-inset-top));
  max-height: calc(100dvh - 22px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  flex-direction: column;
  gap: 18px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  margin-bottom: calc(10px + env(safe-area-inset-bottom));
  padding: 20px 18px calc(18px + env(safe-area-inset-bottom));
  border: 1px solid rgba(133, 184, 209, 0.22);
  border-radius: 28px;
  background:
    radial-gradient(ellipse at 3% 0%, rgba(35, 120, 165, 0.28), transparent 44%),
    radial-gradient(ellipse at 100% 100%, rgba(202, 129, 34, 0.17), transparent 38%),
    linear-gradient(145deg, color-mix(in srgb, var(--background-color) 88%, #102b3d 12%), var(--background-color));
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.07);
  transform: translateY(0) scale(1);
  transition: transform 560ms cubic-bezier(0.22, 1, 0.36, 1);
}

.menu-sheet::before {
  position: absolute;
  z-index: -1;
  top: 0;
  left: 15%;
  width: 70%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(125, 198, 227, 0.66), rgba(227, 164, 71, 0.56), transparent);
  content: "";
}

.menu-topline {
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.menu-kicker,
.menu-footer > span:first-child {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--color-text-secondary);
  font-size: 0.63rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.menu-kicker i,
.menu-footer i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #e0a448;
  box-shadow: 0 0 0 4px rgba(224, 164, 72, 0.12), 0 0 13px rgba(224, 164, 72, 0.5);
}

.menu-kicker b { color: #d99a42; font-weight: 800; }
.menu-top-actions { gap: 10px; }

.menu-top-actions :deep(.theme-toggle) {
  width: 40px;
  height: 40px;
  border: 1px solid rgba(133, 184, 209, 0.2);
  background: rgba(255, 255, 255, 0.045);
  box-shadow: none;
}

.close-button {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid rgba(133, 184, 209, 0.2);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.045);
  color: var(--color-text);
  cursor: pointer;
}

.close-button span {
  position: absolute;
  width: 16px;
  height: 1.5px;
  border-radius: 9px;
  background: currentColor;
}

.close-button span:first-child { transform: rotate(45deg); }
.close-button span:last-child { transform: rotate(-45deg); }

.menu-intro h2 {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(2rem, 9vw, 2.8rem);
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 0.96;
}

.menu-intro h2 span {
  color: transparent;
  background: linear-gradient(98deg, #91cde6 4%, #b6d7e3 48%, #edb45e 100%);
  background-clip: text;
  -webkit-background-clip: text;
}

.menu-intro p {
  margin: 9px 0 0;
  color: var(--color-text-secondary);
  font-size: 0.84rem;
  line-height: 1.45;
}

.menu-links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.menu-link {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 82px;
  grid-template-columns: 26px minmax(0, 1fr) 18px;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  padding: 12px 11px;
  border: 1px solid rgba(128, 173, 195, 0.15);
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.018));
  color: var(--color-text);
  text-decoration: none;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  animation: menu-link-in 0.35s both;
  animation-delay: calc(var(--link-index, 0) * 35ms);
}

.menu-link:nth-child(5) { grid-column: 1 / -1; min-height: 72px; }

.menu-link:hover,
.menu-link.active {
  transform: translateY(-2px);
  border-color: rgba(222, 171, 95, 0.46);
  background:
    radial-gradient(ellipse at 0% 0%, rgba(62, 149, 191, 0.24), transparent 65%),
    linear-gradient(120deg, rgba(20, 81, 116, 0.72), rgba(21, 42, 55, 0.82) 66%, rgba(138, 87, 27, 0.44));
  box-shadow: 0 10px 24px rgba(2, 12, 20, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.07);
}

.menu-link-number {
  align-self: start;
  padding-top: 1px;
  color: #8bbcd0;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.menu-link-copy {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.menu-link-copy strong {
  overflow: hidden;
  font-size: 0.9rem;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-link-copy small {
  overflow: hidden;
  color: var(--color-text-secondary);
  font-size: 0.64rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-link > svg {
  align-self: start;
  color: #d7a04c;
  transition: transform 0.2s ease;
}

.menu-link:hover > svg { transform: translate(2px, -2px); }

.login-card,
.account-card {
  border: 1px solid rgba(128, 173, 195, 0.18);
  border-radius: 18px;
  background: linear-gradient(110deg, rgba(27, 81, 111, 0.34), rgba(255, 255, 255, 0.035));
}

.login-card {
  display: flex;
  min-height: 68px;
  align-items: center;
  gap: 11px;
  padding: 11px 13px;
  color: var(--color-text);
  text-decoration: none;
}

.login-icon {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  border: 1px solid rgba(225, 172, 89, 0.28);
  border-radius: 13px;
  background: rgba(190, 119, 30, 0.13);
  color: #e1ae5d;
}

.login-card > span:nth-child(2),
.account-copy { display: grid; min-width: 0; gap: 4px; }
.login-card strong,.account-copy strong { font-size: 0.8rem; }
.login-card small,.account-copy small { overflow: hidden; color: var(--color-text-secondary); font-size: 0.65rem; text-overflow: ellipsis; white-space: nowrap; }
.login-arrow { margin-left: auto; color: #d7a04c; }

.account-card { padding: 12px; }
.account-summary { display: flex; align-items: center; gap: 10px; }

.account-avatar {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(225, 172, 89, 0.4);
  border-radius: 15px;
  background: linear-gradient(135deg, #1f7298, #bd761d);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 800;
}

.account-avatar img { width: 100%; height: 100%; object-fit: cover; }
.account-copy { flex: 1; }

.account-open {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  place-items: center;
  border: 1px solid rgba(128, 173, 195, 0.17);
  border-radius: 12px;
  color: var(--color-text);
}

.account-actions { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 11px; }
.account-actions button,.account-actions a {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  padding: 0 10px;
  border: 1px solid rgba(128, 173, 195, 0.16);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.045);
  color: var(--color-text-secondary);
  font: inherit;
  font-size: 0.66rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.account-actions .logout-action { color: #eda097; }

.menu-footer {
  display: flex;
  min-height: 22px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 2px;
  color: var(--color-text-secondary);
  font-size: 0.57rem;
  font-weight: 700;
  letter-spacing: 0.07em;
}

.menu-footer > span:first-child { gap: 8px; font-size: 0.57rem; }
.menu-footer i { width: 6px; height: 6px; background: #61cb9a; box-shadow: 0 0 0 4px rgba(97, 203, 154, 0.1), 0 0 12px rgba(97, 203, 154, 0.4); }

.mobile-menu-enter-active,
.mobile-menu-leave-active { transition: opacity 560ms ease; }
.mobile-menu-enter-from,
.mobile-menu-leave-to { opacity: 0; }
.mobile-menu-enter-from .mobile-menu-panel,
.mobile-menu-leave-to .mobile-menu-panel { clip-path: ellipse(0 0 at var(--genie-x) var(--genie-y)); }
.mobile-menu-enter-from .menu-sheet,
.mobile-menu-leave-to .menu-sheet { transform: translateY(24px) scale(0.94); }

@keyframes menu-link-in {
  from { transform: translateY(7px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@media (max-width: 360px) {
  .mobile-header { min-height: 62px; padding-left: 10px; }
  .brand-mark { width: 32px; height: 32px; flex-basis: 32px; }
  .brand-copy strong { font-size: 0.75rem; }
  .brand-copy small { font-size: 0.42rem; letter-spacing: 0.07em; }
  .header-actions { gap: 6px; }
  .header-cta { min-height: 42px; padding: 0 9px; font-size: 0.68rem; }
  .menu-trigger { width: 44px; height: 44px; flex-basis: 44px; border-radius: 14px; }
  .menu-sheet { gap: 14px; padding-right: 14px; padding-left: 14px; border-radius: 24px; }
  .menu-link { min-height: 76px; grid-template-columns: 21px minmax(0, 1fr) 16px; gap: 6px; padding: 10px 8px; }
  .menu-link-copy strong { font-size: 0.82rem; }
  .menu-link-copy small { font-size: 0.59rem; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
}
</style>
