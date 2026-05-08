<template>
  <div class="app">
    <ParticleBackground />
    <TheHeader />
    <div class="content"><slot></slot></div>

    <footer class="site-footer">
      <div class="footer-shell">
        <div class="footer-top">
          <div class="footer-brand">
            <h2>K-Studio</h2>
            <p>
              Разработка и развитие сайтов на Vue/Nuxt с фокусом на SEO,
              интеграции и автоматизацию.
            </p>
          </div>

          <div class="footer-contacts">
            <a
              href="https://t.me/kiruhak11"
              target="_blank"
              rel="noopener noreferrer"
            >
              Telegram
            </a>
            <a href="mailto:kiruhak2005@gmail.com">kiruhak2005@gmail.com</a>
          </div>
        </div>

        <div class="footer-bottom">
          <span>© {{ currentYear }} K-Studio</span>
          <span>Запуск, поддержка и масштабирование веб‑проектов</span>
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
import ParticleBackground from "~/components/ParticleBackground.vue";

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
  border-radius: 20px;
  border: 1px solid var(--border-color);
  background: radial-gradient(
      circle at 8% 12%,
      var(--footer-glow-1),
      transparent 36%
    ),
    radial-gradient(circle at 88% 88%, var(--footer-glow-2), transparent 40%),
    var(--footer-surface);
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.footer-top {
  display: grid;
  grid-template-columns: minmax(280px, 1.4fr) minmax(220px, 1fr);
  gap: 24px;
  align-items: center;
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
  border: 1px solid var(--border-color);
  background: var(--footer-pill-bg);
  border-radius: 999px;
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
  background: radial-gradient(
      circle at 30% 30%,
      rgba(255, 255, 255, 0.35),
      transparent 60%
    ),
    var(--gradient-primary);
  color: #fff;
  border-radius: 100%;
  position: fixed;
  right: 32px;
  bottom: 32px;
  z-index: 5;
  opacity: 0;
  transform: translateY(14px) scale(0.94);
  cursor: pointer;
  visibility: hidden;
  border: 1px solid rgba(255, 255, 255, 0.28);
  transition: all 0.28s ease;
  box-shadow: 0 12px 26px rgba(102, 126, 234, 0.34);
  backdrop-filter: blur(10px);

  &_active {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
  }
  &:hover {
    transform: translateY(-4px) scale(1.04);
    box-shadow: 0 16px 30px rgba(102, 126, 234, 0.45);
  }

  svg {
    width: 22px;
    height: 22px;
  }
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
