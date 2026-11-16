<template>
  <main class="recovery-page">
    <section class="recovery-card" aria-labelledby="recovery-title">
      <p class="eyebrow">Защита аккаунта</p>
      <h1 id="recovery-title">Восстановление пароля</h1>
      <p class="intro">Подтвердите привязанный Telegram-аккаунт. Новый пароль задаётся только на этом сайте.</p>
      <p class="recovery-privacy">
        <NuxtLink to="/legal/privacy">Политика обработки персональных данных</NuxtLink>
      </p>

      <p v-if="status === 'signed-out'" class="notice" role="status"> Войдите в аккаунт через Telegram, чтобы продолжить. </p>
      <template v-else-if="!verified">
        <p v-if="status === 'failed'" class="notice error" role="alert"> Telegram не подтвердил аккаунт или подтверждение устарело. Начните заново. </p>
        <p v-if="errorMessage" class="notice error" role="alert">{{ errorMessage }}</p>
        <p v-if="status === 'ready'" class="notice" role="status"> Подтверждение будет выполнено через официальный Telegram Login. </p>
        <button
          class="primary"
          type="button"
          :disabled="busy"
          @click="startRecovery"
        >
          {{ busy ? "Подготовка…" : "Подтвердить через Telegram" }}
        </button>
      </template>
      <form v-else class="password-form" @submit.prevent="submitPassword">
        <p class="notice success" role="status">Telegram-аккаунт подтверждён. Задайте новый пароль.</p>
        <label for="new-password">Новый пароль</label>
        <input
          id="new-password"
          v-model="newPassword"
          type="password"
          autocomplete="new-password"
          minlength="12"
          required
        />
        <label for="confirm-password">Повторите пароль</label>
        <input
          id="confirm-password"
          v-model="confirmPassword"
          type="password"
          autocomplete="new-password"
          minlength="12"
          required
        />
        <p class="hint">Не менее 12 символов. Пароль не отправляется в Telegram.</p>
        <p v-if="errorMessage" class="notice error" role="alert">{{ errorMessage }}</p>
        <button class="primary" type="submit" :disabled="busy">
          {{ busy ? "Сохранение…" : "Изменить пароль" }}
        </button>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
useHead({
  title: "Восстановление пароля",
  meta: [
    { name: "robots", content: "noindex, nofollow" },
    { name: "referrer", content: "no-referrer" },
  ],
});

const route = useRoute();
const { token, user, initAuth, clearLocalSession } = useAuth();

const busy = ref(false);
const challengeId = ref(
  typeof route.query.challenge === "string" ? route.query.challenge : ""
);
const verified = ref(
  route.query.result === "verified" && /^[a-f0-9]{64}$/.test(challengeId.value)
);
const status = ref(route.query.result === "failed" ? "failed" : "ready");
const newPassword = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");

onMounted(async () => {
  await initAuth();

  if (!token.value || !user.value) {
    status.value = "signed-out";
  }
});

/** Запрашивает челлендж и уводит пользователя в официальный Telegram Login. */
async function startRecovery() {
  if (!token.value) {
    status.value = "signed-out";
    return;
  }

  busy.value = true;
  status.value = "ready";

  try {
    const response = await $fetch<{
      success: boolean;
      challengeId: string;
      authorizeUrl: string;
    }>("/api/auth/recovery/challenge", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });

    window.location.assign(response.authorizeUrl);
  } catch (error) {
    const failure = error as { statusCode?: number; status?: number } | undefined;
    const code = failure?.statusCode ?? failure?.status;

    errorMessage.value =
      code === 429
        ? "Превышен лимит попыток. Подождите 15 минут и попробуйте снова."
        : "Сервис восстановления временно недоступен. Попробуйте позже.";
    status.value = "service-error";
  } finally {
    busy.value = false;
  }
}

/** Задаёт новый пароль после подтверждения Telegram и завершает сессию. */
async function submitPassword() {
  errorMessage.value = "";

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = "Пароли не совпадают.";
    return;
  }

  if (!token.value || !challengeId.value) {
    errorMessage.value = "Сессия или подтверждение истекли. Начните заново.";
    return;
  }

  busy.value = true;

  try {
    await $fetch<{ success: boolean }>("/api/auth/recovery/complete", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
      body: {
        challengeId: challengeId.value,
        newPassword: newPassword.value,
        confirmPassword: confirmPassword.value,
      },
    });

    newPassword.value = "";
    confirmPassword.value = "";
    clearLocalSession();
    await navigateTo("/login?passwordChanged=1", { replace: true });
  } catch (error) {
    const failure = error as { statusCode?: number; status?: number } | undefined;
    const code = failure?.statusCode ?? failure?.status;

    errorMessage.value =
      code === 403
        ? "Подтверждение истекло или уже использовано. Начните заново."
        : "Не удалось изменить пароль. Попробуйте начать восстановление заново.";
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
:root {
  --background-color: #f4f6f2;
  --background-color-hover: #edf1eb;
  --background-color-secondary: #e9eee8;
  --airpods-store-color: #41674b;
  --background-color-links: #47544a;
  --border-color: #d7ded7;
  --color-text: #1b241e;
  --color-text-secondary: #47544a;
  --color-text-muted: #637067;
  --color-text-hover: #263a2c;
  --color-accent: #41674b;
  --color-accent-hover: #33543c;
  --box-shadow-color: rgba(21, 41, 27, 0.1);
  --box-shadow-color-hover: rgba(21, 41, 27, 0.16);
  --background-info-color: #e9eee8;
  --gradient-primary: linear-gradient(135deg, #41674b, #587960);
  --gradient-secondary: linear-gradient(135deg, #6e876e, #879782);
  --gradient-success: linear-gradient(135deg, #28744a, #4b9265);
  --gradient-warning: linear-gradient(135deg, #b87936, #d39a50);
  --success-color: #28744a;
  --error-color: #a83f36;
  --warning-color: #9a642a;
  --info-color: #41674b;
  --modal-backdrop: rgba(0, 0, 0, 0.5);
  --card-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  --card-shadow-hover: 0 10px 25px rgba(0, 0, 0, 0.1);
  --input-border: #c4cec4;
  --input-focus: #6d9874;
  --input-background: #fff;
  --particle-overlay-color: hsla(0, 0%, 100%, 0.05);
  --footer-surface: hsla(0, 0%, 100%, 0.82);
  --footer-glow-1: rgba(79, 172, 254, 0.16);
  --footer-glow-2: rgba(250, 112, 154, 0.2);
  --footer-pill-bg: rgba(248, 250, 252, 0.9);
}

.dark {
  --background-color: #0b100e;
  --background-color-hover: #141c16;
  --background-color-secondary: #19231c;
  --airpods-store-color: #b9d9a7;
  --background-color-links: #c0ccc2;
  --border-color: #2a382e;
  --color-text: #f0f4ef;
  --color-text-secondary: #c0ccc2;
  --color-text-muted: #9aa89c;
  --color-text-hover: #f5faf4;
  --color-accent: #b9d9a7;
  --color-accent-hover: #c9e6b9;
  --box-shadow-color: rgba(0, 0, 0, 0.24);
  --box-shadow-color-hover: rgba(0, 0, 0, 0.34);
  --background-info-color: #19231c;
  --gradient-primary: linear-gradient(135deg, #71916f, #9fbd8f);
  --gradient-secondary: linear-gradient(135deg, #637964, #859c7e);
  --gradient-success: linear-gradient(135deg, #43845a, #6ca67c);
  --gradient-warning: linear-gradient(135deg, #a87037, #cb9752);
  --success-color: #8dcc9d;
  --error-color: #f09c91;
  --warning-color: #e2b36d;
  --info-color: #b9d9a7;
  --modal-backdrop: rgba(1, 4, 9, 0.8);
  --card-shadow: 0 4px 6px rgba(1, 4, 9, 0.3);
  --card-shadow-hover: 0 10px 25px rgba(1, 4, 9, 0.4);
  --input-border: #35443a;
  --input-focus: #91b982;
  --input-background: #0d1117;
  --particle-overlay-color: rgba(7, 10, 14, 0.2);
  --footer-surface: rgba(13, 17, 23, 0.78);
  --footer-glow-1: rgba(88, 166, 255, 0.2);
  --footer-glow-2: rgba(121, 192, 255, 0.14);
  --footer-pill-bg: rgba(22, 27, 34, 0.92);
}

.recovery-page {
  display: grid;
  min-height: 70vh;
  padding: 48px 20px;
  place-items: center;
}

.recovery-card {
  background: var(--surface-color, #fff);
  border: 1px solid var(--border-color, #dfe5e1);
  border-radius: 24px;
  box-shadow: 0 24px 70px #14281c14;
  color: var(--text-color, #17221c);
  padding: clamp(24px, 5vw, 40px);
  width: min(100%, 520px);
}

.recovery-privacy {
  font-size: 0.82rem;
  margin: 0.75rem 0;
}

.recovery-privacy a {
  color: var(--accent-color, #41674b);
  text-underline-offset: 3px;
}

.eyebrow {
  color: #238550;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  font-size: clamp(1.8rem, 5vw, 2.5rem);
  line-height: 1.12;
  margin: 8px 0 12px;
}

.hint,
.intro {
  color: var(--muted-color, #657169);
  line-height: 1.6;
}

.notice {
  background: color-mix(in srgb, #238550 9%, transparent);
  border-radius: 12px;
  line-height: 1.5;
  margin: 20px 0;
  padding: 14px 16px;
}

.notice.error {
  background: color-mix(in srgb, #bd3434 9%, transparent);
}

.notice.success {
  background: color-mix(in srgb, #238550 11%, transparent);
}

.primary {
  background: #238550;
  border: 0;
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  min-height: 48px;
  width: 100%;
}

.primary:focus-visible,
input:focus-visible {
  outline: 3px solid #78c895;
  outline-offset: 3px;
}

.primary:disabled {
  cursor: wait;
  opacity: 0.65;
}

.password-form {
  display: grid;
  gap: 12px;
}

label {
  font-weight: 600;
}

input {
  background: var(--surface-color, #fff);
  border: 1px solid var(--border-color, #cbd5ce);
  border-radius: 10px;
  color: inherit;
  font: inherit;
  min-height: 48px;
  padding: 10px 12px;
  width: 100%;
}

.hint {
  font-size: 0.9rem;
  margin: 0;
}
</style>
