export default defineNuxtPlugin(() => {
  // Добавляем аналитику Kiruhak
  const analyticsUrl = "/analytics.js";
  
  useHead({
    script: [
      {
        innerHTML: 'window.KIRUHAK_SITE_ID = "cmetglx3f0001ri3lsfzyscli";',
      },
      {
        src: analyticsUrl,
        async: true,
      },
    ],
  });
});
