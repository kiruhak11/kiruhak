import { ref, readonly } from "vue";

interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
  isAdmin: boolean;
  balance: number;
  sitesCount: number;
  transactionsCount: number;
  createdAt: string;
}

export const useAuth = () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const loading = ref(false);

  // Инициализация из localStorage
  const initAuth = async () => {
    if (process.client) {
      const savedToken = localStorage.getItem("auth_token");
      const savedUser = localStorage.getItem("auth_user");

      if (savedToken && savedUser) {
        token.value = savedToken;
        user.value = JSON.parse(savedUser);

        console.log("🔐 useAuth: Состояние аутентификации восстановлено", {
          user: user.value,
          token: token.value ? "***" : null,
          tokenLength: token.value ? token.value.length : 0,
        });

        // Обновляем данные пользователя с сервера
        try {
          await refreshUser();
          console.log("🔐 useAuth: Данные пользователя обновлены с сервера");
        } catch (error) {
          console.error(
            "🔐 useAuth: Ошибка обновления данных пользователя:",
            error
          );
        }
      } else {
        console.log("🔐 useAuth: Нет сохраненных данных аутентификации");
      }
    }
  };

  // Аутентификация по логину и паролю
  const loginWithCredentials = async (login: string, password: string) => {
    console.log("🔐 useAuth: Попытка входа с данными:", {
      login,
      password: "***",
    });
    loading.value = true;

    try {
      console.log("🔐 useAuth: Отправка запроса к API...");
      const response = await $fetch("/api/auth/login", {
        method: "POST",
        body: { login, password },
      });

      console.log("🔐 useAuth: Ответ от API:", response);

      if (response.success) {
        user.value = response.user;
        token.value = response.token;

        // Сохраняем в localStorage
        if (process.client) {
          localStorage.setItem("auth_token", response.token);
          localStorage.setItem("auth_user", JSON.stringify(response.user));
        }

        console.log("🔐 useAuth: Вход успешен");
        return { success: true };
      } else {
        console.log("🔐 useAuth: Ошибка входа:", response.error);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error("🔐 useAuth: Ошибка при входе:", error);
      return { success: false, error: "Login failed" };
    } finally {
      loading.value = false;
    }
  };

  // Выход
  const logout = () => {
    user.value = null;
    token.value = null;

    if (process.client) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }
  };

  // Обновление данных пользователя
  const refreshUser = async () => {
    if (!token.value) return;

    try {
      const response = await $fetch("/api/user/me", {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      });

      if (response.success) {
        user.value = response.user;

        if (process.client) {
          localStorage.setItem("auth_user", JSON.stringify(response.user));
        }
      } else {
        // Токен недействителен, выходим
        logout();
      }
    } catch (error) {
      console.error("Refresh user error:", error);
      logout();
    }
  };

  // Проверка аутентификации
  const isAuthenticated = computed(() => !!user.value);

  // Проверка прав администратора
  const isAdmin = computed(() => user.value?.isAdmin || false);

  // Форматирование баланса
  const formattedBalance = computed(() => {
    if (!user.value) return "0 ₽";
    return `${(user.value.balance / 100).toFixed(0)} ₽`;
  });

  return {
    user: readonly(user),
    token: readonly(token),
    loading: readonly(loading),
    isAuthenticated,
    isAdmin,
    formattedBalance,
    initAuth,
    loginWithCredentials,
    logout,
    refreshUser,
  };
};
