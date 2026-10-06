<template>
  <div class="app">
    <TheHeader />
    <div class="content"><slot></slot></div>

    <footer class="site-footer">
      <div class="footer-shell">
        <div class="footer-top">
          <div class="footer-brand">
            <h2>{{ publicContact.fullName }}</h2>
            <p>
              Портфолио веб-разработчика. Сайты и веб-приложения на Vue/Nuxt — от интерфейса до production.
            </p>
          </div>

          <nav class="footer-navigation" aria-label="Навигация в подвале">
            <NuxtLink to="/">Главная</NuxtLink>
            <NuxtLink to="/projects">Проекты</NuxtLink>
            <NuxtLink to="/contact">Контакты</NuxtLink>
            <NuxtLink to="/login" class="platform-link">Вход в платформу</NuxtLink>
          </nav>

          <div class="footer-contacts">
            <a
              :href="publicContact.telegram.href"
              target="_blank"
              rel="noopener noreferrer"
            >
              Telegram
            </a>
            <a :href="publicContact.email.href">{{ publicContact.email.label }}</a>
          </div>
        </div>

        <div class="footer-bottom">
          <span>© {{ currentYear }} {{ publicContact.fullName }} · K-Studio</span>
          <span>Проекты, реализация и технологии</span>
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
import { ref, onMounted, onUnmounted } from "vue";
import { publicContact } from "~/constants/public-contact";

const goTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};
const isActive = ref<boolean>(false);
const currentYear = new Date().getFullYear();
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

.site-footer {
  position: relative;
  z-index: 1;
  padding: 16px 16px 28px;
}

.footer-shell {
  margin: 0 auto;
  max-width: 1280px;
  padding: 26px 24px;
  border-radius: var(--portfolio-radius-lg);
  border: 1px solid var(--portfolio-border);
  background: var(--portfolio-bg-elevated);
  box-shadow: var(--portfolio-shadow-soft);
}

.footer-top {
  display: grid;
  grid-template-columns: minmax(280px, 1.4fr) minmax(150px, 0.8fr) minmax(220px, 1fr);
  gap: 24px;
  align-items: center;
}

.footer-navigation,
.footer-contacts {
  display: grid;
  justify-items: start;
  gap: 10px;
}

.footer-navigation a,
.footer-contacts a {
  color: var(--color-text-secondary);
  text-decoration: none;
}

.footer-navigation a:hover,
.footer-contacts a:hover { color: var(--color-text); }

.footer-navigation .platform-link {
  margin-top: 8px;
  font-size: 0.82rem;
}

.footer-brand h2 {
  color: var(--color-text);
  margin: 0;
  font-size: 1.2rem;
}

.footer-brand p {
  margin: 10px 0 0;
  max-width: 620px;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.footer-contacts {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.footer-contacts a {
  text-decoration: none;
  color: var(--color-text);
  border: 1px solid var(--portfolio-border);
  background: var(--portfolio-surface);
  border-radius: var(--portfolio-radius-pill);
  padding: 10px 14px;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.footer-contacts a:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.footer-bottom {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
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
  transition: all 0.28s ease;
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
  .footer-contacts a,
  .button-go-top { transition: none; }
  .footer-contacts a:hover,
  .button-go-top:hover { transform: none; }
}

@media (max-width: 900px) {
  .footer-top {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .footer-contacts {
    justify-content: flex-start;
  }

  .button-go-top {
    right: 16px;
    bottom: 16px;
  }
}
</style>
