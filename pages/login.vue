<template>
  <NuxtLayout>
    <div class="login-page">
      <div class="container">
        <div class="login-card">
          <div class="login-header">
            <h1>Вход в систему</h1>
            <p>Войдите через Telegram для доступа к аналитике</p>
          </div>

          <div class="login-content">
            <!-- Кнопка перехода в Telegram бота -->
            <div class="telegram-bot-section">
              <h3>Создать аккаунт</h3>
              <p>Перейдите в Telegram бота для создания аккаунта</p>
              <a
                href="https://t.me/gs_company_bot"
                target="_blank"
                rel="noopener noreferrer"
                class="telegram-btn"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.05-.2-.06-.06-.14-.04-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.75-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06-.01.13-.02.2z"
                  />
                </svg>
                Перейти в Telegram бота
              </a>
            </div>

            <!-- Форма входа -->
            <div class="login-form-section">
              <h3>Войти в систему</h3>

              <!-- Переключатель режима входа -->
              <div class="login-mode-switch">
                <button
                  @click="loginMode = 'credentials'"
                  :class="{ active: loginMode === 'credentials' }"
                  class="mode-btn"
                >
                  Логин/Пароль
                </button>
              </div>

              <!-- Форма логин/пароль -->
              <form
                v-if="loginMode === 'credentials'"
                @submit.prevent="handleLogin"
                class="login-form"
              >
                <div class="form-group">
                  <label for="login">Логин</label>
                  <input
                    id="login"
                    v-model="loginForm.login"
                    type="text"
                    placeholder="Введите логин"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="password">Пароль</label>
                  <input
                    id="password"
                    v-model="loginForm.password"
                    type="password"
                    placeholder="Введите пароль"
                    required
                  />
                </div>

                <button
                  type="submit"
                  class="login-submit-btn"
                  :disabled="loading"
                >
                  {{ loading ? "Вход..." : "Войти" }}
                </button>
              </form>

            </div>

            <!-- Информация о системе -->
            <div class="system-info">
              <h3>Что вы получите:</h3>
              <ul>
                <li>
                  🎁 <strong>150 рублей</strong> на баланс при регистрации
                </li>
                <li>📊 Отслеживание посещений ваших сайтов</li>
                <li>📈 Детальная аналитика и статистика</li>
                <li>💳 Система оплаты за создание сайтов (100₽ за сайт)</li>
                <li>🔒 Безопасная аутентификация через Telegram бота</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
const { loginWithCredentials, loading, initAuth } = useAuth();
const router = useRouter();

// Инициализация аутентификации
onMounted(async () => {
  await initAuth();
});

// Режим входа
const loginMode = ref("credentials");

// Форма входа
const loginForm = ref({
  login: "",
  password: "",
});

// Обработка входа по логину/паролю
const handleLogin = async () => {
  if (!loginForm.value.login || !loginForm.value.password) {
    alert("Пожалуйста, заполните все поля");
    return;
  }

  try {
    const result = await loginWithCredentials(
      loginForm.value.login,
      loginForm.value.password
    );

    if (result.success) {
      // Принудительно обновляем состояние аутентификации
      const { initAuth, refreshUser } = useAuth();
      await initAuth();
      await refreshUser();

      // Ждем обновления состояния и следующего тика
      await new Promise((resolve) => setTimeout(resolve, 100));
      await nextTick();

      await navigateTo("/analytics");
    } else {
      alert("Ошибка входа: " + result.error);
    }
  } catch (error) {
    console.error("Ошибка при входе:", error);
    alert("Произошла ошибка при входе: " + error.message);
  }
};
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.container {
  max-width: 500px;
  width: 100%;
  padding: 0 1rem;
}

.login-card {
  background: var(--background-color);
  border-radius: 20px;
  padding: 3rem 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  p {
    color: var(--text-muted);
    font-size: 1.1rem;
  }
}

.login-content {
  .telegram-bot-section {
    text-align: center;
    margin-bottom: 2rem;

    h3 {
      margin-bottom: 1rem;
      color: var(--text-color);
    }

    p {
      margin-bottom: 1.5rem;
      color: var(--text-muted);
    }

    .telegram-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #0088cc;
      color: white;
      text-decoration: none;
      padding: 1rem 2rem;
      border-radius: 12px;
      font-weight: 600;
      transition: all 0.3s ease;

      &:hover {
        background: #0077b3;
        transform: translateY(-2px);
      }

      svg {
        width: 24px;
        height: 24px;
      }
    }
  }

  .login-form-section {
    background: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;

    h3 {
      margin-bottom: 1.5rem;
      color: var(--text-color);
      text-align: center;
    }

    .login-mode-switch {
      display: flex;
      background: var(--border-color);
      border-radius: 8px;
      padding: 4px;
      margin-bottom: 1.5rem;

      .mode-btn {
        flex: 1;
        padding: 0.75rem 1rem;
        border: none;
        background: transparent;
        color: var(--text-color);
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;

        &.active {
          background: var(--background-color);
          color: #667eea;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        &:hover:not(.active) {
          background: rgba(102, 126, 234, 0.1);
        }
      }
    }

    .login-form {
      .form-group {
        margin-bottom: 1.5rem;

        label {
          display: block;
          margin-bottom: 0.5rem;
          color: var(--text-color);
          font-weight: 500;
        }

        input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--background-color);
          color: var(--text-color);
          font-size: 1rem;
          transition: border-color 0.3s ease;

          &:focus {
            outline: none;
            border-color: #667eea;
          }

          &::placeholder {
            color: var(--text-muted);
          }
        }
      }

      .login-submit-btn {
        width: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 1rem;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      }
    }
  }

  .system-info {
    background: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;

    h3 {
      margin-bottom: 1rem;
      color: var(--text-color);
      font-size: 1.2rem;
    }

    ul {
      list-style: none;
      padding: 0;

      li {
        margin-bottom: 0.75rem;
        color: var(--text-color);
        display: flex;
        align-items: center;
        gap: 0.5rem;

        strong {
          color: #667eea;
        }
      }
    }
  }

  .demo-info {
    text-align: center;
    padding: 1.5rem;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 12px;
    border: 1px solid rgba(102, 126, 234, 0.2);

    h3 {
      margin-bottom: 0.5rem;
      color: var(--text-color);
    }

    p {
      margin-bottom: 1rem;
      color: var(--text-muted);
    }

    .demo-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: transform 0.2s ease;

      &:hover {
        transform: translateY(-2px);
      }
    }
  }
}

@media (max-width: 768px) {
  .login-card {
    padding: 2rem 1rem;
  }

  .login-header h1 {
    font-size: 2rem;
  }
}
</style>
