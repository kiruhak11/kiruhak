export default defineNuxtPlugin(() => {
  // Добавляем аналитику Kiruhak
  useHead({
    script: [
      {
        innerHTML: 'window.KIRUHAK_SITE_ID = "cmetglx3f0001ri3lsfzyscli";',
      },
      {
        src: "https://kiruhak11.ru/analytics.js",
        async: true,
      },
    ],
  });
});
