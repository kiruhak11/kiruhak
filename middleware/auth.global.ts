export default defineNuxtRouteMiddleware(async (to) => {
  console.log("🔒 Middleware: проверка маршрута", to.path);

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
        console.error(
          "🔒 Middleware: Ошибка обновления данных пользователя:",
          error
        );
      }
    }

    console.log("🔒 Middleware: isAuthenticated =", isAuthenticated.value);
    console.log("🔒 Middleware: isAdmin =", isAdmin.value);

    // Защищаем страницу аналитики
    if (to.path.startsWith("/analytics")) {
      if (!isAuthenticated.value) {
        console.log(
          "🔒 Middleware: перенаправляем на /login (не аутентифицирован)"
        );
        return navigateTo("/login");
      }
      console.log("🔒 Middleware: доступ к /analytics разрешен");
    }

    // Защищаем админ-панель
    if (to.path.startsWith("/admin")) {
      if (!isAuthenticated.value) {
        console.log(
          "🔒 Middleware: перенаправляем на /login (не аутентифицирован)"
        );
        return navigateTo("/login");
      }

      if (!isAdmin.value) {
        console.log("🔒 Middleware: перенаправляем на /analytics (не админ)");
        return navigateTo("/analytics");
      }
      console.log("🔒 Middleware: доступ к /admin разрешен");
    }
  } else {
    console.log("🔒 Middleware: выполняется на сервере, пропускаем проверку");
  }
});
