export default defineNuxtPlugin(() => {
  // Переопределяем $fetch для автоматического добавления токена
  const originalFetch = globalThis.$fetch;

  globalThis.$fetch = $fetch.create({
    onRequest({ request, options }) {
      if (process.client) {
        const token = localStorage.getItem("auth_token");
        if (token) {
          options.headers = options.headers || {};
          options.headers.Authorization = `Bearer ${token}`;
          console.log("🔐 Plugin: Добавлен токен к запросу", request);
        }
      }
    },
  });

  console.log("🔐 Plugin: Плагин аутентификации загружен");
});
