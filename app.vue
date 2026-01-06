<template>
  <div>
    <FrogModal />
    <nuxt-page />
  </div>
</template>
<script setup lang="ts">
useSeoMeta({
  titleTemplate: (title) =>
    title
      ? `${title} | K-Studio — Веб‑разработка под ключ`
      : "K-Studio — Веб‑разработка под ключ",
  ogTitle: "K-Studio — Веб‑разработка под ключ",
  description:
    "K-Studio — корпоративная веб‑разработка под ключ. Проектирование, разработка, интеграции и поддержка сайтов и веб‑сервисов. Vue/Nuxt, SEO и автоматизация.",
  ogDescription:
    "Корпоративные сайты, интернет‑проекты и веб‑приложения. Экспертиза во Vue/Nuxt, интеграции, SEO. Доводим до результата.",
  ogType: "website",
  twitterCard: "summary_large_image",
});

// Добавляем аналитику Kiruhak
useHead({
  script: [
    {
      innerHTML: 'window.KIRUHAK_SITE_ID = "cmetglx3f0001ri3lsfzyscli";',
    },
    {
      src: process.env.NODE_ENV === 'production' ? "https://kiruhak11.ru/analytics.js" : "/analytics.js",
      async: true,
    },
  ],
});
</script>

<style lang="scss" src="~/assets/styles/index.scss"></style>
