export default defineNuxtPlugin(() => {
  // Добавляем аналитику Kiruhak
  useHead({
    script: [
      {
        innerHTML: 'window.KIRUHAK_SITE_ID = "cmete8lh50001ricjc8r3e5ql";',
      },
      {
        src: "https://kiruhak11.ru/analytics.js",
        async: true,
      },
    ],
  });
});
