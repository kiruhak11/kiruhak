<template>
  <div class="error-page">
    <header class="error-header">
      <a class="error-brand" href="/">Кирилл Коваленко</a>
      <ThemeToggle />
    </header>

    <main class="error-content" aria-labelledby="error-title">
      <p v-if="notFound" class="error-code">404</p>
      <h1 id="error-title">{{ title }}</h1>
      <p>{{ notFound ? "Проверьте адрес или выберите раздел ниже." : "Попробуйте вернуться на главную." }}</p>
      <nav class="error-actions" aria-label="Разделы портфолио">
        <a class="error-home" href="/">На главную</a>
        <a href="/projects">Проекты</a>
        <a href="/contact">Контакты</a>
      </nav>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();
const notFound = computed(() => props.error.statusCode === 404);
const title = computed(() => notFound.value ? "Страница не найдена" : "Не удалось открыть страницу");

useSeoMeta({ title, robots: "noindex, nofollow" });
if (import.meta.server) useResponseHeader("X-Robots-Tag").value = "noindex, nofollow";
</script>

<style lang="scss" src="~/assets/styles/index.scss"></style>

<style scoped>
.error-page {
  min-height: 100dvh;
  background: var(--portfolio-bg);
  color: var(--portfolio-text);
  font-family: var(--portfolio-font-sans);
}
.error-header,.error-content {
  width: min(48rem, calc(100% - 2 * var(--portfolio-gutter)));
  margin-inline: auto;
}
.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: .75rem;
  padding-block: 1rem;
  border-bottom: 1px solid var(--portfolio-border);
}
.error-brand {
  display: inline-flex;
  min-height: var(--portfolio-control-compact);
  align-items: center;
  color: var(--portfolio-text);
  font-weight: 650;
  text-decoration: underline;
  text-underline-offset: .2em;
}
.error-content { padding-block: clamp(2.75rem, 11vw, 7rem); }
.error-content h1 { margin: 0; font-size: clamp(2rem, 6vw, 3.5rem); line-height: 1.08; letter-spacing: -.045em; }
.error-content p { margin: .8rem 0 0; color: var(--portfolio-text-secondary); font-size: 1rem; line-height: 1.55; }
.error-content .error-code { margin: 0 0 .65rem; color: var(--portfolio-accent); font-family: var(--portfolio-font-mono); font-weight: 650; }
.error-actions { display: flex; flex-wrap: wrap; gap: .4rem 1rem; margin-top: 1.4rem; }
.error-actions a { display: inline-flex; align-items: center; min-height: var(--portfolio-control-standard); color: var(--portfolio-text); text-decoration: underline; text-underline-offset: .2em; }
.error-actions .error-home { padding-inline: .9rem; border-radius: var(--portfolio-radius-sm); background: var(--portfolio-accent); color: var(--portfolio-accent-contrast); text-decoration: none; }
.error-page a:focus-visible { outline: 2px solid var(--portfolio-accent); outline-offset: 3px; }
</style>
