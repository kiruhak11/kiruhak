export default defineNuxtPlugin(() => {
  // Переопределяем $fetch для автоматического добавления токена
  const originalFetch = globalThis.$fetch;

  globalThis.$fetch = $fetch.create({
    onRequest({ request, options }) {
      if (process.client) {
        const token = localStorage.getItem("auth_token");
        console.log(
          "🔐 Plugin: onRequest для",
          request,
          "token:",
          token ? "present" : "missing"
        );

        if (token) {
          options.headers = options.headers || {};
          options.headers.Authorization = `Bearer ${token}`;
          console.log("🔐 Plugin: Добавлен токен к запросу", request);
          console.log("🔐 Plugin: Headers:", options.headers);
        } else {
          console.log(
            "🔐 Plugin: Токен не найден в localStorage для запроса",
            request
          );
        }
      }
    },
    onResponseError({ response, request }) {
      // Если получаем 401, проверяем контекст
      if (response.status === 401) {
        console.log("🔐 Plugin: Получен 401 для запроса", request);

        // Не перенаправляем автоматически, позволяем компонентам обработать ошибку
        // Только логируем для отладки
        console.log(
          "🔐 Plugin: 401 ошибка - требуется ручная обработка в компоненте"
        );
      }
    },
  });

  console.log("🔐 Plugin: Плагин аутентификации загружен");
});
