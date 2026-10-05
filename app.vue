<template>
  <div>
    <FrogModal />
    <nuxt-page />
  </div>
</template>
<script setup lang="ts">
useSeoMeta({
  titleTemplate: (title) =>
    title && title.includes("Кирилл Коваленко")
      ? title
      : title
        ? `${title} | Кирилл Коваленко — веб-разработчик`
        : "Кирилл Коваленко — веб-разработчик Vue/Nuxt",
  ogTitle: "Кирилл Коваленко — веб-разработчик Vue/Nuxt",
  description:
    "Портфолио Кирилла Коваленко: коммерческие сайты, веб-приложения и собственные проекты на Vue, Nuxt и TypeScript. О задачах, реализации и технологиях каждого проекта.",
  ogDescription:
    "Сайты и веб-приложения на Vue/Nuxt — описание продукта, моя реализация, технические задачи и стек.",
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
