import { ref, readonly } from "vue";

interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

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
  const logoutLoading = ref(false);

  const safeParseUser = (raw: string | null): User | null => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  };

  /**
   * Фиксирует успешную авторизацию: пользователь и токен в состоянии.
   */
  const persistAuthenticatedSession = (
    response: AuthResponse
  ): { user: User; token: string } | null => {
    if (!response.success || !response.user || !response.token) return null;
    user.value = response.user;
    token.value = response.token;
    return { user: response.user, token: response.token };
  };

  // Инициализация из localStorage
  const initAuth = async () => {
    if (import.meta.client) {
      const savedToken = localStorage.getItem("auth_token");
      const savedUser = localStorage.getItem("auth_user");
      const parsedUser = safeParseUser(savedUser);

      if (savedToken && parsedUser) {
        token.value = savedToken;
        user.value = parsedUser;

      }
    }
  };

  // Аутентификация по логину и паролю
  const loginWithCredentials = async (login: string, password: string) => {
    loading.value = true;

    try {
      const response = (await $fetch("/api/auth/login", {
        method: "POST",
        body: { login, password },
      })) as AuthResponse;

      const persisted = persistAuthenticatedSession(response);

      if (persisted) {
        // Сохраняем в localStorage
        if (import.meta.client) {
          localStorage.setItem("auth_token", persisted.token);
          localStorage.setItem("auth_user", JSON.stringify(persisted.user));
        }

        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Login failed" };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Завершает вход через Telegram Login (OIDC).
   *
   * Токен проверяется на сервере: клиент лишь передаёт транзакцию и id_token.
   */
  const completeTelegramLogin = async (
    transaction: string,
    idToken: string
  ) => {
    loading.value = true;

    try {
      const response = (await $fetch("/api/auth/telegram-login/verify", {
        method: "POST",
        body: { transaction, idToken },
        signal: AbortSignal.timeout(15_000),
      })) as AuthResponse;

      const persisted = persistAuthenticatedSession(response);

      if (persisted) {
        if (import.meta.client) {
          localStorage.setItem("auth_token", persisted.token);
          localStorage.setItem("auth_user", JSON.stringify(persisted.user));
        }
        return { success: true };
      }

      return {
        success: false,
        error: "Не удалось завершить вход через Telegram",
      };
    } catch {
      return {
        success: false,
        error:
          "Не удалось подтвердить вход. Начните попытку заново или войдите по логину и паролю.",
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Очищает локальную сессию (состояние и хранилище браузера).
   */
  const clearLocalSession = () => {
    user.value = null;
    token.value = null;

    if (import.meta.client) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }

    return true;
  };

  // Выход: серверный отзыв текущей сессии + очистка локального состояния.
  const logout = async () => {
    if (logoutLoading.value) {
      return {
        serverRevoked: false,
        localCleared: false,
        alreadyInProgress: true,
      };
    }
    logoutLoading.value = true;

    const sessionToken = token.value;
    let serverRevoked = !sessionToken;
    try {
      if (sessionToken) {
        const response = (await $fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${sessionToken}` },
          signal: AbortSignal.timeout(10_000),
        })) as { success?: boolean };
        serverRevoked = response.success === true;
      }
    } catch (error) {
      const statusCode =
        (error as { statusCode?: number })?.statusCode ??
        (error as { status?: number })?.status ??
        (error as { response?: { status?: number } })?.response?.status;
      // 401 означает, что сессия уже недействительна — считаем отзыв выполненным.
      serverRevoked = statusCode === 401;
    } finally {
      logoutLoading.value = false;
    }

    const localCleared = clearLocalSession();

    return { serverRevoked, localCleared, alreadyInProgress: false };
  };

  // Обновление данных пользователя
  const refreshUser = async () => {
    if (!token.value) {
      return;
    }

    try {
      const response = (await $fetch("/api/user/me", {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })) as AuthResponse;

      if (response.success && response.user) {
        user.value = response.user;

        if (import.meta.client) {
          localStorage.setItem("auth_user", JSON.stringify(response.user));
        }
      } else {
        clearLocalSession();
      }
    } catch (error) {
      console.error("Refresh user error:", error);

      // Проверяем тип ошибки
      if ((error as { status?: number })?.status === 401) {
        clearLocalSession();
      }
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
    if (import.meta.client) {
      const savedToken = localStorage.getItem("auth_token");
      const savedUser = localStorage.getItem("auth_user");

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
    if (import.meta.client) {
      const savedToken = localStorage.getItem("auth_token");
      const savedUser = localStorage.getItem("auth_user");
      const parsedUser = safeParseUser(savedUser);

      if (savedToken && parsedUser) {
        // Восстанавливаем состояние
        token.value = savedToken;
        user.value = parsedUser;

        // Пытаемся обновить данные с сервера
        try {
          await refreshUser();
          return true;
        } catch (error) {
          console.error("Token refresh error:", error);
          clearLocalSession();
          return false;
        }
      }
    }
    return false;
  };

  // Проверка валидности токена
  const validateToken = () => {
    if (import.meta.client && token.value) {
      try {
        const payloadPart = token.value.includes(".")
          ? token.value.split(".")[0]
          : token.value;
        const normalized = payloadPart
          .replace(/-/g, "+")
          .replace(/_/g, "/")
          .padEnd(Math.ceil(payloadPart.length / 4) * 4, "=");
        const decoded = JSON.parse(atob(normalized));
        const currentTime = Math.floor(Date.now() / 1000);

        return {
          isValid: decoded.exp > currentTime,
          timeLeft: decoded.exp - currentTime,
          userId: decoded.userId,
        };
      } catch (error) {
        return {
          isValid: false,
          error: error instanceof Error ? error.message : "No token",
        };
      }
    }
    return { isValid: false, error: "No token" };
  };

  return {
    user: readonly(user),
    token: readonly(token),
    loading: readonly(loading),
    logoutLoading: readonly(logoutLoading),
    isAuthenticated,
    isAdmin,
    formattedBalance,
    initAuth,
    loginWithCredentials,
    completeTelegramLogin,
    logout,
    clearLocalSession,
    refreshUser,
    checkTokenStatus,
    forceRefreshToken,
    validateToken,
  };
};
