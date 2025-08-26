<template>
  <div class="test-auth-page">
    <div class="container">
      <h1>Тест системы аутентификации</h1>

      <div class="test-section">
        <h2>Статус аутентификации</h2>
        <p>Аутентифицирован: {{ isAuthenticated ? "Да" : "Нет" }}</p>
        <p v-if="user">
          Пользователь: {{ user.firstName }} {{ user.lastName }}
        </p>
        <p v-if="user">Баланс: {{ formattedBalance }}</p>
        <p v-if="user">Админ: {{ isAdmin ? "Да" : "Нет" }}</p>
      </div>

      <div class="test-section">
        <h2>Действия</h2>
        <button @click="testLogin" class="test-btn">Тест входа (admin)</button>
        <button @click="testLoginUser" class="test-btn">
          Тест входа (user)
        </button>
        <button @click="testLogout" class="test-btn">Тест выхода</button>
        <button @click="testRefresh" class="test-btn">Обновить данные</button>
      </div>

      <div class="test-section">
        <h2>API тесты</h2>
        <button @click="testPublicAPI" class="test-btn">
          Тест публичного API
        </button>
        <button @click="testProtectedAPI" class="test-btn">
          Тест защищенного API
        </button>
        <button @click="testUserAPI" class="test-btn">
          Тест API пользователя
        </button>
      </div>

      <div class="test-section">
        <h2>Результаты</h2>
        <pre>{{ testResults }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
const {
  user,
  token,
  isAuthenticated,
  isAdmin,
  formattedBalance,
  loginWithTelegram,
  logout,
  refreshUser,
} = useAuth();
const testResults = ref("");

// Тест входа админа
const testLogin = async () => {
  const result = await loginWithCredentials("admin", "admin123");
  testResults.value = JSON.stringify(result, null, 2);
};

// Тест входа обычного пользователя
const testLoginUser = async () => {
  const result = await loginWithCredentials("user_757it8", "bce40e44");
  testResults.value = JSON.stringify(result, null, 2);
};

// Тест выхода
const testLogout = () => {
  logout();
  testResults.value = "Выход выполнен";
};

// Тест обновления данных
const testRefresh = async () => {
  await refreshUser();
  testResults.value = "Данные обновлены";
};

// Тест публичного API
const testPublicAPI = async () => {
  try {
    const response = await $fetch("/api/test-auth");
    testResults.value = JSON.stringify(response, null, 2);
  } catch (error) {
    testResults.value = "Ошибка: " + error.message;
  }
};

// Тест защищенного API
const testProtectedAPI = async () => {
  try {
    const response = await $fetch("/api/user/me", {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });
    testResults.value = JSON.stringify(response, null, 2);
  } catch (error) {
    testResults.value = "Ошибка: " + error.message;
  }
};

// Тест API пользователя
const testUserAPI = async () => {
  try {
    const response = await $fetch("/api/sites", {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });
    testResults.value = JSON.stringify(response, null, 2);
  } catch (error) {
    testResults.value = "Ошибка: " + error.message;
  }
};
</script>

<style lang="scss" scoped>
.test-auth-page {
  padding: 2rem 0;

  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  h1 {
    font-size: 2.5rem;
    margin-bottom: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .test-section {
    background: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;

    h2 {
      margin-bottom: 1rem;
      color: var(--text-color);
    }

    p {
      margin-bottom: 0.5rem;
      color: var(--text-color);
    }

    .test-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      margin-right: 1rem;
      margin-bottom: 1rem;
      transition: transform 0.2s ease;

      &:hover {
        transform: translateY(-2px);
      }
    }

    pre {
      background: #1a1a1a;
      color: #fff;
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 0.9rem;
      line-height: 1.4;
    }
  }
}
</style>
