<template>
  <NuxtLayout>
    <div class="bot-login-page">
      <div class="bot-login-card">
        <h1>Вход через Telegram</h1>
        <p v-if="loading">Выполняем авторизацию...</p>
        <p v-else-if="error" class="error">{{ error }}</p>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
const route = useRoute();
const loading = ref(true);
const error = ref("");

onMounted(async () => {
  const token = String(route.query.token || "").trim();

  if (!token) {
    error.value = "Ссылка входа недействительна";
    loading.value = false;
    return;
  }

  try {
    if (process.client) {
      localStorage.setItem("auth_token", token);
      document.cookie = `auth_token=${token}; path=/; max-age=86400; SameSite=Strict`;
    }

    const response = await $fetch<{ success: boolean; user?: unknown }>("/api/user/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.success || !response.user) {
      throw new Error("Не удалось получить данные пользователя");
    }

    if (process.client) {
      localStorage.setItem("auth_user", JSON.stringify(response.user));
    }

    await navigateTo("/analytics");
  } catch (e) {
    if (process.client) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    error.value = "Ссылка входа устарела или недействительна";
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
.bot-login-page {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.bot-login-card {
  width: 100%;
  max-width: 480px;
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: var(--card-shadow);
  padding: 2rem;
  text-align: center;
}

.error {
  color: #ef4444;
}
</style>
