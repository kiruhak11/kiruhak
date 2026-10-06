<template>
  <div>
    <FrogModal />
    <nuxt-page />
  </div>
</template>
<script setup lang="ts">
const route = useRoute();
const robotsIndexing = computed(() =>
  /^\/(login|analytics|content|auth-callback|bot-login|admin)(\/|$)/.test(route.path) || ["/success", "/error"].includes(route.path)
    ? "noindex, nofollow"
    : "index, follow"
);

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
  twitterCard: "summary",
  robots: robotsIndexing,
});
</script>

<style lang="scss" src="~/assets/styles/index.scss"></style>
