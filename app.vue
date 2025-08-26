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
</script>

<style lang="scss" src="~/assets/styles/index.scss"></style>
