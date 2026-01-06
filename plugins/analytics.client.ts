export default defineNuxtPlugin(() => {
  // Добавляем аналитику Kiruhak
  const config = useRuntimeConfig();
  const isDev = process.env.NODE_ENV !== 'production';
  
  // В режиме разработки используем локальный путь
  const analyticsUrl = isDev ? '/analytics.js' : 'https://kiruhak11.ru/analytics.js';
  
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
