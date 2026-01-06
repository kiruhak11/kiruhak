export default defineNuxtRouteMiddleware(async (to) => {
  // Проверяем аутентификацию только на клиенте
  if (process.client) {
    const { isAuthenticated, isAdmin, initAuth, refreshUser } = useAuth();

    // Инициализируем аутентификацию при каждом переходе
    await initAuth();

    // Обновляем данные пользователя с сервера при каждом переходе
    if (isAuthenticated.value) {
      try {
        await refreshUser();
      } catch (error) {
        console.error("Auth middleware error:", error);
      }
    }

    // Защищаем страницу аналитики
    if (to.path.startsWith("/analytics")) {
      if (!isAuthenticated.value) {
        return navigateTo("/login");
      }
    }

    // Защищаем админ-панель
    if (to.path.startsWith("/admin")) {
      if (!isAuthenticated.value) {
        return navigateTo("/login");
      }

      if (!isAdmin.value) {
        return navigateTo("/analytics");
      }
    }
  }
});
