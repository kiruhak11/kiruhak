export default defineNuxtRouteMiddleware(async (to) => {
  // Проверяем аутентификацию только на клиенте
  if (import.meta.client) {
    const { isAuthenticated, isAdmin, initAuth } = useAuth();

    // Восстанавливаем сессию: сохранённый токен проверяется сервером,
    // localStorage сам по себе не является доказательством авторизации.
    const session = await initAuth();

    // Перенаправляем только когда сервер подтвердил, что сессии нет.
    // При недоступном API (unverified) перенаправлять нельзя: это создаёт
    // ложное состояние и циклы навигации. Доступ к данным всё равно
    // защищён серверной проверкой токена.
    const hasNoSession = session.status === "anonymous";

    // Защищаем страницу аналитики
    if (to.path.startsWith("/analytics")) {
      if (hasNoSession) {
        return navigateTo("/login");
      }
    }

    // Защищаем админ-панель
    if (to.path.startsWith("/admin")) {
      if (hasNoSession) {
        return navigateTo("/login");
      }

      if (!isAuthenticated.value || !isAdmin.value) {
        return navigateTo("/analytics");
      }
    }
  }
});
