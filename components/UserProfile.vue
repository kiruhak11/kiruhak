<template>
  <div class="user-profile">
    <div class="profile-header">
      <div class="profile-avatar">
        <img
          v-if="user?.photoUrl"
          :src="user.photoUrl"
          :alt="user?.firstName"
          class="avatar-image"
        />
        <div v-else class="avatar-placeholder">
          {{ user?.firstName?.charAt(0) }}{{ user?.lastName?.charAt(0) }}
        </div>
      </div>
      <div class="profile-info">
        <h3>{{ user?.firstName }} {{ user?.lastName }}</h3>
        <p class="username">@{{ user?.username || "user" }}</p>
        <p class="balance">Баланс: {{ formattedBalance }}</p>
      </div>
    </div>

    <div class="profile-actions">
      <button @click="openTopUpModal" class="topup-btn">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Пополнить баланс
      </button>
      <button @click="showEditForm = true" class="edit-btn">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Редактировать профиль
      </button>
      <NuxtLink to="/account/recovery" class="recovery-link">
        Подтвердить Telegram и сменить пароль
      </NuxtLink>
      <NuxtLink v-if="user?.isAdmin" to="/admin/projects" class="admin-btn">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Админ панель
      </NuxtLink>
      <button
        type="button"
        class="logout-btn"
        :disabled="logoutLoading"
        :aria-busy="logoutLoading"
        @click="handleLogout"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <polyline
            points="16,17 21,12 16,7"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <line
            x1="21"
            y1="12"
            x2="9"
            y2="12"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Выйти
      </button>
    </div>

    <!-- Модалки -->
    <EditProfileModal
      :show="showEditForm"
      :user="user"
      @close="showEditForm = false"
      @saved="handleProfileSaved"
    />

    <TopUpBalanceModal
      :show="showTopUpForm"
      :formatted-balance="formattedBalance"
      @close="showTopUpForm = false"
      @balance-updated="handleBalanceUpdated"
    />
  </div>
</template>

<script setup lang="ts">
const {
  user,
  token,
  isAuthenticated,
  logout,
  logoutLoading,
  formattedBalance,
  initAuth,
  refreshUser,
} = useAuth();

// Инициализируем аутентификацию
onMounted(async () => {
  console.log("🔐 UserProfile: Начало инициализации");
  await initAuth();
  console.log("🔐 UserProfile: Состояние аутентификации:", {
    isAuthenticated: isAuthenticated.value,
    hasToken: !!token.value,
    user: user.value,
  });

  // Обновляем данные пользователя с сервера при загрузке страницы
  if (isAuthenticated.value) {
    console.log("🔐 UserProfile: Данные пользователя подтверждены сервером:", {
      balance: user.value?.balance,
      formattedBalance: formattedBalance.value,
    });
  } else {
    console.log("🔐 UserProfile: Пользователь не аутентифицирован");
  }
});

const router = useRouter();

const showEditForm = ref(false);
const showTopUpForm = ref(false);

const handleProfileSaved = () => {
  // Обновляем данные пользователя после сохранения профиля
  refreshUser();
};

const handleBalanceUpdated = () => {
  console.log("💰 Баланс обновлен в UserProfile");
  // Дополнительная логика при обновлении баланса, если нужна
};

const openTopUpModal = () => {
  console.log("🔐 Открытие модалки пополнения баланса");
  showTopUpForm.value = true;
};

const handleLogout = () => {
  logout();
  router.push("/login");
};
</script>

<style lang="scss" scoped>
.user-profile {
  background: var(--background-color);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  box-shadow: var(--card-shadow);
  min-width: 280px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.profile-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;

  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-placeholder {
    color: white;
    font-size: 1.5rem;
    font-weight: bold;
  }
}
.admin-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;

  background: var(--gradient-primary);
  color: white;
}
.profile-info {
  flex: 1;

  h3 {
    margin: 0 0 0.25rem 0;
    color: var(--text-color);
    font-size: 1.1rem;
  }

  .username {
    margin: 0 0 0.5rem 0;
    color: var(--text-muted);
    font-size: 0.9rem;
  }

  .balance {
    margin: 0;
    color: var(--accent-color);
    font-weight: 600;
    font-size: 0.9rem;
  }
}

.profile-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .recovery-link {
    display: block;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-color);
    font-size: 0.9rem;
    text-align: center;
    text-decoration: none;

    &:hover,
    &:focus-visible {
      border-color: var(--accent-color);
      color: var(--accent-color);
    }
  }

  button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &.topup-btn {
      background: linear-gradient(135deg, #4caf50, #45a049);
      color: white;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
      }
    }

    &.edit-btn {
      background: var(--gradient-primary);
      color: white;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }
    }

    &.check-btn {
      background: linear-gradient(135deg, #ff9800, #f57c00);
      color: white;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
      }
    }

    &.logout-btn {
      background: transparent;
      color: var(--text-color);
      border: 1px solid var(--border-color);

      &:hover {
        background: var(--background-color-hover);
        border-color: var(--accent-color);
        color: var(--accent-color);
      }
    }
  }
}
</style>
