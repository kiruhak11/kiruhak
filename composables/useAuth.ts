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

  // Инициализация из localStorage и cookies
  const initAuth = async () => {
    if (process.client) {
      const savedToken = localStorage.getItem("auth_token");
      const savedUser = localStorage.getItem("auth_user");

      console.log("🔐 useAuth: Инициализация аутентификации", {
        hasSavedToken: !!savedToken,
        hasSavedUser: !!savedUser,
        tokenLength: savedToken ? savedToken.length : 0,
      });

      if (savedToken && savedUser) {
        token.value = savedToken;
        user.value = JSON.parse(savedUser);

        // Также сохраняем в cookies для серверного доступа
        document.cookie = `auth_token=${savedToken}; path=/; max-age=86400; SameSite=Strict`;

        console.log("🔐 useAuth: Состояние аутентификации восстановлено", {
          user: user.value,
          token: token.value ? "***" : null,
          tokenLength: token.value ? token.value.length : 0,
          tokenPreview: token.value
            ? token.value.substring(0, 20) + "..."
            : null,
        });

        // Не обновляем данные пользователя сразу, чтобы избежать дублирующих запросов
        console.log(
          "🔐 useAuth: Состояние аутентификации восстановлено из localStorage"
        );
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

        // Сохраняем в localStorage и cookies
        if (process.client) {
          localStorage.setItem("auth_token", response.token);
          localStorage.setItem("auth_user", JSON.stringify(response.user));

          // Также сохраняем в cookies для серверного доступа
          document.cookie = `auth_token=${response.token}; path=/; max-age=86400; SameSite=Strict`;

          console.log("🔐 useAuth: Токен сохранен в localStorage и cookies:", {
            tokenLength: response.token.length,
            tokenPreview: response.token.substring(0, 20) + "...",
          });
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

      // Также удаляем из cookies
      document.cookie =
        "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  };

  // Обновление данных пользователя
  const refreshUser = async () => {
    if (!token.value) {
      console.log("🔐 useAuth: refreshUser - нет токена");
      return;
    }

    try {
      console.log("🔐 useAuth: Обновление данных пользователя с сервера");
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

        console.log("🔐 useAuth: Данные пользователя успешно обновлены");
      } else {
        console.log("🔐 useAuth: Ошибка в ответе сервера, выходим");
        logout();
      }
    } catch (error) {
      console.error("🔐 useAuth: Refresh user error:", error);

      // Проверяем тип ошибки
      if (error.status === 401) {
        console.log("🔐 useAuth: Токен недействителен, выходим");
      }

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

  // Проверка состояния токена
  const checkTokenStatus = () => {
    if (process.client) {
      const savedToken = localStorage.getItem("auth_token");
      const savedUser = localStorage.getItem("auth_user");

      console.log("🔐 useAuth: Проверка состояния токена", {
        hasToken: !!savedToken,
        hasUser: !!savedUser,
        tokenLength: savedToken ? savedToken.length : 0,
        currentToken: token.value ? "present" : "missing",
        currentUser: user.value ? "present" : "missing",
      });

      return {
        hasToken: !!savedToken,
        hasUser: !!savedUser,
        tokenLength: savedToken ? savedToken.length : 0,
      };
    }
    return null;
  };

  // Принудительное обновление токена
  const forceRefreshToken = async () => {
    console.log("🔐 useAuth: Принудительное обновление токена");

    if (process.client) {
      const savedToken = localStorage.getItem("auth_token");
      const savedUser = localStorage.getItem("auth_user");

      if (savedToken && savedUser) {
        // Восстанавливаем состояние
        token.value = savedToken;
        user.value = JSON.parse(savedUser);

        // Пытаемся обновить данные с сервера
        try {
          await refreshUser();
          console.log("🔐 useAuth: Токен успешно обновлен");
          return true;
        } catch (error) {
          console.error("🔐 useAuth: Ошибка обновления токена:", error);
          logout();
          return false;
        }
      } else {
        console.log("🔐 useAuth: Нет сохраненных данных для обновления");
        return false;
      }
    }
    return false;
  };

  // Проверка валидности токена
  const validateToken = () => {
    if (process.client && token.value) {
      try {
        const decoded = JSON.parse(
          Buffer.from(token.value, "base64").toString()
        );
        const currentTime = Math.floor(Date.now() / 1000);

        console.log("🔐 useAuth: Проверка токена:", {
          userId: decoded.userId,
          exp: decoded.exp,
          currentTime,
          isValid: decoded.exp > currentTime,
          timeLeft: decoded.exp - currentTime,
        });

        return {
          isValid: decoded.exp > currentTime,
          timeLeft: decoded.exp - currentTime,
          userId: decoded.userId,
        };
      } catch (error) {
        console.error("🔐 useAuth: Ошибка декодирования токена:", error);
        return { isValid: false, error: error.message };
      }
    }
    return { isValid: false, error: "No token" };
  };

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
    checkTokenStatus,
    forceRefreshToken,
    validateToken,
  };
};
