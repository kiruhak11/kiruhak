<template>
  <div class="auth-callback">
    <div class="loading">
      <div class="spinner"></div>
      <p>Обработка авторизации...</p>
    </div>
  </div>
</template>

<script setup>
const { loginWithTelegram } = useAuth();
const router = useRouter();

onMounted(async () => {
  try {
    // Получаем данные из URL параметров
    const urlParams = new URLSearchParams(window.location.search);
    const userData = {
      id: urlParams.get('id'),
      first_name: urlParams.get('first_name'),
      last_name: urlParams.get('last_name'),
      username: urlParams.get('username'),
      photo_url: urlParams.get('photo_url'),
      auth_date: urlParams.get('auth_date'),
      hash: urlParams.get('hash')
    };

    // Проверяем, что получили все необходимые данные
    if (!userData.id || !userData.first_name) {
      throw new Error('Неполные данные авторизации');
    }

    // Выполняем вход
    const result = await loginWithTelegram(userData);
    
    if (result.success) {
      // Перенаправляем на аналитику
      await router.push('/analytics');
    } else {
      throw new Error(result.error || 'Ошибка авторизации');
    }

  } catch (error) {
    console.error('Auth callback error:', error);
    // Перенаправляем на страницу входа с ошибкой
    await router.push('/login?error=' + encodeURIComponent(error.message));
  }
});
</script>

<style lang="scss" scoped>
.auth-callback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.loading {
  text-align: center;
  color: white;

  .spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  p {
    font-size: 1.1rem;
    margin: 0;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
