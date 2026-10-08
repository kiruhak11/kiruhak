<template>
  <div class="app" :class="{ 'app--portfolio': isPortfolioPage }">
    <TheHeader />
    <div class="content"><slot></slot></div>

    <footer class="site-footer" aria-label="Контакты и навигация сайта">
      <div class="footer-shell">
        <div class="footer-top">
          <div class="footer-brand">
            <h2>{{ publicContact.fullName }}</h2>
            <p>Веб-разработчик · Vue / Nuxt</p>
          </div>

          <nav class="footer-navigation" aria-label="Разделы портфолио">
            <span class="footer-heading">Портфолио</span>
            <NuxtLink to="/">Главная</NuxtLink>
            <NuxtLink to="/projects">Проекты</NuxtLink>
            <NuxtLink to="/contact">Контакты</NuxtLink>
          </nav>

          <div class="footer-contacts">
            <span class="footer-heading">Ссылки</span>
            <a
              :href="publicContact.telegram.href"
              target="_blank"
              rel="noopener noreferrer"
            >
              Telegram <span>{{ publicContact.telegram.label }}</span>
            </a>
            <a :href="publicContact.email.href">Email <span>{{ publicContact.email.label }}</span></a>
            <a :href="publicContact.github.href" target="_blank" rel="noopener noreferrer">
              GitHub <span>{{ publicContact.github.label }}</span>
            </a>
          </div>
        </div>

        <div class="footer-bottom">
          <span>© {{ currentYear }} {{ publicContact.fullName }}</span>
          <NuxtLink class="platform-link" to="/login">Вход в платформу <span aria-hidden="true">↗</span></NuxtLink>
        </div>
      </div>
    </footer>

    <button
      :class="['button-go-top', { 'button-go-top_active': isActive }]"
      @click="goTop"
      type="button"
      aria-label="Подняться наверх"
      title="Наверх"
    >
      <IconGoTop />
    </button>
    <GlobalModal />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { publicContact } from "~/constants/public-contact";

const route = useRoute();
const isPortfolioPage = computed(() => ["/", "/projects", "/contact"].includes(route.path));

const goTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};
const isActive = ref<boolean>(false);
const currentYear = useState("portfolio-current-year", () => new Date().getFullYear());
const scrollListener = () => {
  if (window.scrollY >= 400) {
    isActive.value = true;
    return;
  }
  isActive.value = false;
};
onMounted(() => {
  window.addEventListener("scroll", scrollListener);
});
onUnmounted(() => {
  window.removeEventListener("scroll", scrollListener);
});
</script>

<style scoped lang="scss">
.content {
  flex-grow: 1;
  position: relative;
  z-index: 1;
}
body {
  background-color: var(--background-color);
}
.app {
  display: flex;
  position: relative;
  flex-direction: column;
  min-height: 100dvh;
  isolation: isolate;
}

.app--portfolio {
  font-family: var(--portfolio-font-sans);
}

.site-footer {
  position: relative;
  z-index: 1;
  padding: 16px var(--portfolio-gutter) 28px;
}

.footer-shell {
  margin: 0 auto;
  width: min(var(--portfolio-content-width), 100%);
  padding: clamp(1.25rem, 3vw, 2rem);
  border: 1px solid var(--portfolio-border);
  border-radius: var(--portfolio-radius-lg);
  background: var(--portfolio-bg-elevated);
  box-shadow: var(--portfolio-shadow-soft);
}

.footer-top {
  display: grid;
  grid-template-columns: minmax(220px, 1.2fr) minmax(130px, 0.65fr) minmax(240px, 1fr);
  gap: clamp(1.25rem, 3vw, 2.5rem);
  align-items: start;
}

.footer-navigation,
.footer-contacts {
  display: grid;
  justify-items: start;
  gap: 0.6rem;
}

.footer-navigation a,
.footer-contacts a {
  color: var(--portfolio-text-secondary);
  text-decoration: none;
  text-underline-offset: 3px;
}

.footer-navigation a:hover,
.footer-contacts a:hover { color: var(--portfolio-text); text-decoration: underline; }

.footer-heading {
  margin-bottom: 0.2rem;
  color: var(--portfolio-text-muted);
  font-family: var(--portfolio-font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.footer-brand h2 {
  color: var(--portfolio-text);
  margin: 0;
  font-size: 1.05rem;
  letter-spacing: -0.025em;
}

.footer-brand p {
  margin: 0.5rem 0 0;
  color: var(--portfolio-text-muted);
  font-size: 0.82rem;
  line-height: 1.55;
}

.footer-contacts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem 1.2rem;
}

.footer-contacts a {
  display: grid;
  min-width: 0;
  gap: 0.15rem;
  font-size: 0.82rem;
  font-weight: 600;
}

.footer-contacts a span {
  overflow-wrap: anywhere;
  color: var(--portfolio-text-muted);
  font-size: 0.72rem;
  font-weight: 400;
}

.footer-bottom {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--portfolio-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  color: var(--portfolio-text-muted);
  font-size: 0.75rem;
}

.platform-link {
  color: var(--portfolio-text-muted);
  text-decoration: none;
  text-underline-offset: 3px;
}

.platform-link:hover { color: var(--portfolio-text); text-decoration: underline; }
.footer-navigation a:focus-visible,.footer-contacts a:focus-visible,.platform-link:focus-visible,.button-go-top:focus-visible { outline: 2px solid var(--portfolio-accent); outline-offset: 3px; }
.footer-navigation a,.footer-contacts a,.platform-link { transition: color var(--portfolio-motion-fast) ease; }

@media (max-width: 900px) {
  .footer-top { grid-template-columns: 1fr 1fr; }
  .footer-brand { grid-column: 1 / -1; }
}

.button-go-top {
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--portfolio-accent);
  color: var(--portfolio-accent-contrast);
  border-radius: 100%;
  position: fixed;
  right: 32px;
  bottom: 32px;
  z-index: 5;
  opacity: 0;
  transform: translateY(14px) scale(0.94);
  cursor: pointer;
  visibility: hidden;
  border: 1px solid var(--portfolio-border-hover);
  transition: opacity var(--portfolio-motion-normal) ease, visibility var(--portfolio-motion-normal) ease, transform var(--portfolio-motion-normal) var(--portfolio-ease-standard), box-shadow var(--portfolio-motion-fast) ease;
  box-shadow: var(--portfolio-shadow-soft);
  backdrop-filter: blur(10px);

  &_active {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
  }
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--portfolio-shadow);
  }

  svg {
    width: 22px;
    height: 22px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .button-go-top { transition: none; }
  .button-go-top:hover { transform: none; }
}

@media (max-width: 900px) {
  .button-go-top {
    right: 16px;
    bottom: 16px;
  }
}

@media (max-width: 520px) {
  .footer-top { grid-template-columns: 1fr; gap: 1.25rem; }
  .footer-brand { grid-column: auto; }
  .footer-contacts { grid-template-columns: 1fr 1fr; }
  .footer-bottom { align-items: flex-start; flex-direction: column; gap: 0.55rem; }
}
</style>
