<script setup lang="ts">
const TELEGRAM_SDK_URL = "https://oauth.telegram.org/js/telegram-login.js?6";
const TELEGRAM_HINT_ID = "telegram-login-hint";
const TELEGRAM_SUPPORT_URL = "https://t.me/kiruhak11bot";
const TELEGRAM_CHALLENGE_TTL_MS = 300_000;
const TELEGRAM_AUTH_TIMEOUT_MS = 120_000;
const TELEGRAM_SDK_TIMEOUT_MS = 10_000;

type TelegramLoginChallenge = {
  transaction: string;
  nonce: string;
  clientId: number;
  expiresAt: number;
};

type TelegramLoginWidget = {
  auth: (
    params: { client_id: number; nonce: string; lang: string; scope: string[] },
    callback: (result: { id_token?: string; error?: string }) => void
  ) => void;
};

declare global {
  interface Window {
    Telegram?: { Login?: TelegramLoginWidget };
  }
}

const {
  loginWithCredentials,
  completeTelegramLogin,
  loading,
  initAuth,
} = useAuth();

const route = useRoute();
const router = useRouter();

const telegramLoginEnabled = ref(false);
const telegramOwnerCanary = ref(false);
const telegramSdkReady = ref(false);
const telegramLoading = ref(false);
const errorMessage = ref("");
const telegramMessage = ref("");
const loginForm = ref({ login: "", password: "" });
const telegramTransaction = ref<TelegramLoginChallenge | null>(null);

const passwordChanged = computed(() => route.query.passwordChanged === "1");
const logoutWarning = computed(() => route.query.logout === "server-revoke-pending");
const localLogoutWarning = computed(
  () => route.query.logout === "local-clear-pending"
);

const telegramButtonLabel = computed(() => {
  if (telegramLoading.value) return "Подтверждаем вход…";
  return telegramTransaction.value
    ? "Продолжить в Telegram"
    : "Войти через Telegram";
});

const telegramHint = computed(() => {
  if (!telegramSdkReady.value) return "Подключаем защищённый вход Telegram…";
  if (telegramTransaction.value)
    return "Проверка подготовлена. Telegram откроется в отдельном окне.";
  if (telegramOwnerCanary.value)
    return "Ограниченный тест входа: сессию сможет получить только владелец аккаунта.";
  return "Подтвердите Telegram. Откроется только существующий связанный аккаунт.";
});

/**
 * Загружает официальный Telegram Login SDK ровно один раз.
 */
let telegramSdkPromise: Promise<TelegramLoginWidget> | null = null;

function loadTelegramSdk(): Promise<TelegramLoginWidget> {
  if (window.Telegram?.Login?.auth) {
    return Promise.resolve(window.Telegram.Login);
  }
  if (telegramSdkPromise) return telegramSdkPromise;

  telegramSdkPromise = new Promise<TelegramLoginWidget>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TELEGRAM_SDK_URL}"]`
    );
    const script = existing ?? document.createElement("script");

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
    const handleLoad = () => {
      cleanup();
      if (window.Telegram?.Login?.auth) {
        resolve(window.Telegram.Login);
      } else {
        reject(new Error("Telegram login SDK unavailable"));
      }
    };
    const handleError = () => {
      cleanup();
      script.remove();
      reject(new Error("Telegram login SDK failed to load"));
    };
    const timeoutId = window.setTimeout(() => {
      cleanup();
      script.remove();
      reject(new Error("Telegram login SDK timed out"));
    }, TELEGRAM_SDK_TIMEOUT_MS);

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!existing) {
      script.src = TELEGRAM_SDK_URL;
      script.async = true;
      script.referrerPolicy = "no-referrer";
      document.head.appendChild(script);
    }
  }).catch((error) => {
    telegramSdkPromise = null;
    throw error;
  });

  return telegramSdkPromise;
}

/**
 * Запрашивает у сервера одноразовую транзакцию входа.
 */
async function startTelegramLogin(): Promise<void> {
  if (!telegramLoginEnabled.value || telegramLoading.value) return;

  errorMessage.value = "";
  telegramLoading.value = true;

  try {
    const response = await $fetch("/api/auth/telegram-login/start", {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
    });

    if (
      !response.success ||
      !/^[A-Za-z0-9_-]{43}$/.test(response.transaction) ||
      !/^[A-Za-z0-9_-]{43}$/.test(response.nonce) ||
      !Number.isSafeInteger(response.clientId)
    ) {
      throw new Error("Invalid Telegram login challenge");
    }

    telegramTransaction.value = {
      transaction: response.transaction,
      nonce: response.nonce,
      clientId: response.clientId,
      expiresAt: Date.now() + TELEGRAM_CHALLENGE_TTL_MS,
    };
  } catch {
    telegramTransaction.value = null;
    errorMessage.value =
      "Не удалось подготовить вход через Telegram. Попробуйте позже или войдите по логину и паролю.";
  } finally {
    telegramLoading.value = false;
  }
}

/**
 * Открывает Telegram Login и подтверждает вход на сервере.
 */
function continueTelegramLogin(): void {
  const challenge = telegramTransaction.value;
  const widget = window.Telegram?.Login;

  if (!challenge || !widget?.auth || telegramLoading.value) return;

  if (Date.now() >= challenge.expiresAt) {
    telegramTransaction.value = null;
    errorMessage.value =
      "Подготовка входа истекла. Нажмите кнопку ещё раз, чтобы начать заново.";
    return;
  }

  errorMessage.value = "";
  telegramLoading.value = true;

  let settled = false;
  const timeoutId = window.setTimeout(() => {
    if (settled) return;
    settled = true;
    telegramLoading.value = false;
    telegramTransaction.value = null;
    errorMessage.value =
      "Вход не был завершён. Разрешите всплывающее окно и попробуйте ещё раз.";
  }, TELEGRAM_AUTH_TIMEOUT_MS);

  try {
    widget.auth(
      {
        client_id: challenge.clientId,
        nonce: challenge.nonce,
        lang: "ru",
        scope: ["profile"],
      },
      async (result) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);

        const idToken =
          typeof result?.id_token === "string" ? result.id_token : "";

        telegramTransaction.value = null;

        if (result?.error || !idToken || idToken.length > 16384) {
          telegramLoading.value = false;
          errorMessage.value =
            "Вход отменён или не подтверждён. Попробуйте ещё раз или войдите по логину и паролю.";
          return;
        }

        const verified = await completeTelegramLogin(
          challenge.transaction,
          idToken
        );

        if (verified.success) {
          await router.push("/analytics");
        } else {
          telegramLoading.value = false;
          errorMessage.value =
            verified.error || "Не удалось подтвердить вход. Начните попытку заново.";
        }
      }
    );
  } catch {
    window.clearTimeout(timeoutId);
    telegramLoading.value = false;
    telegramTransaction.value = null;
    errorMessage.value =
      "Не удалось открыть Telegram. Разрешите всплывающие окна и попробуйте ещё раз.";
  }
}

async function handleTelegramLogin(): Promise<void> {
  if (!telegramLoginEnabled.value || telegramLoading.value || !telegramSdkReady.value) {
    return;
  }
  if (!telegramTransaction.value) {
    await startTelegramLogin();
    return;
  }
  continueTelegramLogin();
}

async function submitCredentialsLogin(): Promise<void> {
  errorMessage.value = "";
  telegramMessage.value = "";

  const result = await loginWithCredentials(
    loginForm.value.login,
    loginForm.value.password
  );

  if (!result.success) {
    errorMessage.value =
      result.error || "Не удалось войти. Проверьте логин и пароль.";
    return;
  }

  await router.push("/analytics");
}

onMounted(async () => {
  await initAuth();

  try {
    const status = await $fetch("/api/auth/telegram-login/status");
    telegramLoginEnabled.value = status.enabled === true;
    telegramOwnerCanary.value = status.ownerCanary === true;
  } catch {
    telegramLoginEnabled.value = false;
  }

  if (!telegramLoginEnabled.value) return;

  try {
    await loadTelegramSdk();
    telegramSdkReady.value = true;
  } catch {
    errorMessage.value =
      "Не удалось загрузить вход Telegram. Используйте логин и пароль или попробуйте позже.";
  }
});
</script>

<template>
  <main class="login-page">
    <section class="login-shell" aria-labelledby="login-title">
      <div class="login-panel">
        <div class="brand-mark" aria-label="K-Studio">K<span>.</span></div>
        <h1 id="login-title">Войти в K-Studio</h1>
        <p class="intro">
          Откройте личный кабинет и продолжите работу с проектами.
        </p>

        <p v-if="passwordChanged" class="notice" role="status">
          Пароль изменён. Войдите с новым паролем.
        </p>
        <p v-else-if="logoutWarning" class="error-message" role="alert">
          Локальный выход выполнен, но сервер не подтвердил отзыв сессии. Если вы
          потеряли устройство или оно было общим, смените пароль или обратитесь к
          администратору.
        </p>
        <p v-else-if="localLogoutWarning" class="error-message" role="alert">
          Сервер завершил сессию, но браузер не подтвердил очистку локального
          состояния. Закройте вкладки K-Studio и откройте страницу входа заново.
        </p>

        <p v-if="telegramMessage" class="notice" role="status">
          {{ telegramMessage }}
        </p>
        <p v-if="errorMessage" class="error-message" role="alert">
          {{ errorMessage }}
        </p>

        <form class="login-form" @submit.prevent="submitCredentialsLogin">
          <div class="form-group">
            <label for="login">Логин</label>
            <input
              id="login"
              v-model.trim="loginForm.login"
              autocomplete="username"
              name="username"
              type="text"
              required
              placeholder="Введите логин"
            />
          </div>
          <div class="form-group">
            <label for="password">Пароль</label>
            <input
              id="password"
              v-model="loginForm.password"
              autocomplete="current-password"
              name="password"
              type="password"
              required
              placeholder="Введите пароль"
            />
          </div>
          <button class="primary-button" type="submit" :disabled="loading">
            {{ loading ? "Входим…" : "Войти в аккаунт" }}
          </button>
        </form>

        <div v-if="telegramLoginEnabled">
          <div class="separator" aria-hidden="true"><span>или</span></div>
          <button
            class="telegram-button"
            type="button"
            :disabled="telegramLoading || !telegramSdkReady"
            :aria-describedby="TELEGRAM_HINT_ID"
            @click="handleTelegramLogin"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M21.7 3.3a1.2 1.2 0 0 0-1.26-.2L2.5 10.2a1.2 1.2 0 0 0 .1 2.27l4.7 1.58 1.8 5.1a1.2 1.2 0 0 0 2.16.25l2.58-3.83 4.55 3.34a1.2 1.2 0 0 0 1.88-.72l2.45-13.6a1.2 1.2 0 0 0-1.02-1.3ZM9.1 13.5l8.6-6.08-6.66 7.5-.44 2.45-1.5-3.88Z"
              />
            </svg>
            {{ telegramButtonLabel }}
          </button>
          <p :id="TELEGRAM_HINT_ID" class="telegram-hint" role="status">
            {{ telegramHint }}
          </p>
        </div>

        <p class="account-help">
          Если Telegram не связан с вашим аккаунтом, войдите по логину и паролю.
          Новый профиль автоматически создан не будет.
        </p>

        <p class="account-legal-note">
          <NuxtLink to="/legal/privacy">Политика обработки персональных данных</NuxtLink>.
          <a
            class="support-link"
            :href="TELEGRAM_SUPPORT_URL"
            target="_blank"
            rel="noopener noreferrer"
          >
            Нужна помощь? Напишите @kiruhak11 <span aria-hidden="true">↗</span>
          </a>
        </p>
      </div>

      <aside class="editorial-panel" aria-label="Личный кабинет K-Studio">
        <div class="editorial-topline">
          <span class="studio-wordmark">K-Studio</span>
          <span class="status-dot" aria-hidden="true" />
        </div>
        <div class="editorial-copy">
          <p class="editorial-label">ЛИЧНОЕ ПРОСТРАНСТВО</p>
          <h2>Работа над проектами — в одном месте.</h2>
          <p class="editorial-description">
            Управляйте сайтами и просматривайте аналитику после входа в свой
            аккаунт.
          </p>
        </div>
        <div class="editorial-footer">
          <span>Личный кабинет K-Studio</span>
          <span class="editorial-line" aria-hidden="true" />
        </div>
      </aside>
    </section>
  </main>
</template>

<style scoped lang="scss">
:root{--background-color:#f4f6f2;--background-color-hover:#edf1eb;--background-color-secondary:#e9eee8;--airpods-store-color:#41674b;--background-color-links:#47544a;--border-color:#d7ded7;--color-text:#1b241e;--color-text-secondary:#47544a;--color-text-muted:#637067;--color-text-hover:#263a2c;--color-accent:#41674b;--color-accent-hover:#33543c;--box-shadow-color:rgba(21,41,27,.1);--box-shadow-color-hover:rgba(21,41,27,.16);--background-info-color:#e9eee8;--gradient-primary:linear-gradient(135deg,#41674b,#587960);--gradient-secondary:linear-gradient(135deg,#6e876e,#879782);--gradient-success:linear-gradient(135deg,#28744a,#4b9265);--gradient-warning:linear-gradient(135deg,#b87936,#d39a50);--success-color:#28744a;--error-color:#a83f36;--warning-color:#9a642a;--info-color:#41674b;--modal-backdrop:rgba(0,0,0,.5);--card-shadow:0 4px 6px rgba(0,0,0,.07);--card-shadow-hover:0 10px 25px rgba(0,0,0,.1);--input-border:#c4cec4;--input-focus:#6d9874;--input-background:#fff;--particle-overlay-color:hsla(0,0%,100%,.05);--footer-surface:hsla(0,0%,100%,.82);--footer-glow-1:rgba(79,172,254,.16);--footer-glow-2:rgba(250,112,154,.2);--footer-pill-bg:rgba(248,250,252,.9)}
.dark{--background-color:#0b100e;--background-color-hover:#141c16;--background-color-secondary:#19231c;--airpods-store-color:#b9d9a7;--background-color-links:#c0ccc2;--border-color:#2a382e;--color-text:#f0f4ef;--color-text-secondary:#c0ccc2;--color-text-muted:#9aa89c;--color-text-hover:#f5faf4;--color-accent:#b9d9a7;--color-accent-hover:#c9e6b9;--box-shadow-color:rgba(0,0,0,.24);--box-shadow-color-hover:rgba(0,0,0,.34);--background-info-color:#19231c;--gradient-primary:linear-gradient(135deg,#71916f,#9fbd8f);--gradient-secondary:linear-gradient(135deg,#637964,#859c7e);--gradient-success:linear-gradient(135deg,#43845a,#6ca67c);--gradient-warning:linear-gradient(135deg,#a87037,#cb9752);--success-color:#8dcc9d;--error-color:#f09c91;--warning-color:#e2b36d;--info-color:#b9d9a7;--modal-backdrop:rgba(1,4,9,.8);--card-shadow:0 4px 6px rgba(1,4,9,.3);--card-shadow-hover:0 10px 25px rgba(1,4,9,.4);--input-border:#35443a;--input-focus:#91b982;--input-background:#0d1117;--particle-overlay-color:rgba(7,10,14,.2);--footer-surface:rgba(13,17,23,.78);--footer-glow-1:rgba(88,166,255,.2);--footer-glow-2:rgba(121,192,255,.14);--footer-pill-bg:rgba(22,27,34,.92)}
.login-page{align-items:center;color:var(--portfolio-text,#1b241e);display:grid;font-family:var(--portfolio-font-sans,Inter,sans-serif);min-height:calc(100svh - 76px);padding:clamp(2rem,5vw,4.5rem) var(--portfolio-gutter,1.25rem)}
.login-shell{background:var(--portfolio-surface,#fff);border:1px solid var(--portfolio-border,rgba(31,48,37,.14));border-radius:20px;box-shadow:var(--portfolio-shadow-soft,0 8px 24px rgba(11,20,14,.08));display:grid;grid-template-columns:minmax(0,55fr) minmax(0,45fr);margin-inline:auto;min-height:650px;overflow:hidden;width:min(100%,1120px)}
.login-panel{display:flex;flex-direction:column;justify-content:center;min-width:0;padding:clamp(2rem,5vw,4.25rem)}
.brand-mark{background:var(--portfolio-accent,#41674b);border-radius:var(--portfolio-radius-md,.875rem);display:grid;font-size:var(--portfolio-h3,1.125rem);font-weight:700;height:42px;letter-spacing:-.04em;margin-bottom:2rem;place-items:center;width:42px}
.brand-mark,.brand-mark span{color:var(--portfolio-accent-contrast,#fff)}
.brand-mark span{opacity:.7}
h1,h2,p{margin:0}
h1{font-size:var(--portfolio-h2,clamp(1.75rem,3vw,2.5rem));font-weight:650;letter-spacing:-.035em;line-height:1.1}
.intro{color:var(--portfolio-text-secondary,#47544a);line-height:1.6;margin-top:.8rem;max-width:42ch}
.login-form{display:grid;gap:1.2rem;margin-top:2rem}
.form-group{display:grid;gap:.5rem}
.form-group label{font-size:.9rem;font-weight:550}
.form-group input{background:var(--portfolio-bg,#f4f6f2);border:1px solid var(--portfolio-border);border-radius:var(--portfolio-radius-sm,8px);color:var(--portfolio-text,#1b241e);font:inherit;min-height:48px;outline:none;padding:.75rem .9rem;transition:border-color .15s ease,box-shadow .15s ease,background .15s ease;width:100%}
.form-group input::-moz-placeholder{color:var(--portfolio-text-muted,#637067);opacity:1}
.form-group input::placeholder{color:var(--portfolio-text-muted,#637067);opacity:1}
.form-group input:focus-visible{border-color:var(--portfolio-accent,#41674b);box-shadow:0 0 0 3px color-mix(in srgb,var(--portfolio-accent,#41674b) 22%,transparent)}
.primary-button,.telegram-button{align-items:center;border:1px solid transparent;border-radius:var(--portfolio-radius-sm,8px);cursor:pointer;display:inline-flex;font:inherit;font-weight:600;gap:.7rem;justify-content:center;min-height:48px;transition:background .16s ease,border-color .16s ease,transform .16s ease}
.primary-button{background:var(--portfolio-accent,#41674b);color:var(--portfolio-accent-contrast,#fff)}
.primary-button:hover:not(:disabled){background:var(--portfolio-accent-hover,#33543c);transform:translateY(-1px)}
.primary-button:disabled{cursor:wait;opacity:.72}
.separator{align-items:center;color:var(--portfolio-text-muted,#637067);display:flex;font-size:var(--portfolio-label,.75rem);gap:.8rem;margin:1.35rem 0 1.05rem}
.separator:after,.separator:before{background:var(--portfolio-border);content:"";flex:1;height:1px}
.telegram-button{background:var(--portfolio-surface,#fff);border-color:var(--portfolio-border);color:var(--portfolio-text,#1b241e);width:100%}
.telegram-button svg{flex:0 0 auto;height:19px;width:19px}
.telegram-button:not(:disabled):hover{background:var(--portfolio-surface-hover,#edf1eb);border-color:var(--portfolio-border-hover,#41674b)}
.telegram-button:disabled{background:var(--portfolio-bg,#f4f6f2);color:var(--portfolio-text-muted,#637067);cursor:not-allowed}
.primary-button:focus-visible,.support-link:focus-visible,.telegram-button:focus-visible{outline:2px solid var(--portfolio-accent,#41674b);outline-offset:3px}
.account-help,.telegram-hint{color:var(--portfolio-text-secondary,#47544a);font-size:var(--portfolio-small,.875rem);line-height:1.55}
.account-legal-note{color:var(--portfolio-text-muted,#637067);font-size:.78rem;line-height:1.55}
.account-legal-note a{color:var(--portfolio-accent,#41674b);text-underline-offset:3px}
.telegram-hint{margin-top:.7rem}
.account-help{margin-top:1.2rem}
.support-link{color:var(--portfolio-accent,#41674b);font-size:var(--portfolio-small,.875rem);font-weight:550;margin-top:1.1rem;text-decoration:underline;text-underline-offset:3px;width:-moz-fit-content;width:fit-content}
.support-link span{margin-left:.2rem;text-decoration:none}
.error-message,.notice{border-radius:var(--portfolio-radius-md,.875rem);font-size:var(--portfolio-small,.875rem);line-height:1.5;margin-top:1rem;padding:.8rem .95rem}
.notice{background:color-mix(in srgb,var(--portfolio-success) 10%,var(--portfolio-surface,#fff));color:var(--portfolio-text,#1b241e)}
.error-message{background:color-mix(in srgb,var(--portfolio-error) 10%,var(--portfolio-surface,#fff));color:var(--portfolio-error)}
.editorial-panel{background:var(--portfolio-bg,#f4f6f2);color:var(--portfolio-text,#1b241e);display:flex;flex-direction:column;justify-content:space-between;min-width:0;padding:clamp(2rem,4vw,3.5rem)}
.editorial-footer,.editorial-topline{align-items:center;display:flex;gap:1rem;justify-content:space-between}
.studio-wordmark{font-size:var(--portfolio-body,1rem);font-weight:650;letter-spacing:-.02em}
.status-dot{background:var(--portfolio-accent,#41674b);border-radius:50%;height:8px;width:8px}
.editorial-copy{margin-block:auto;max-width:390px;padding:4rem 0}
.editorial-label{color:var(--portfolio-text-muted,#637067);font:600 .72rem/1.4 var(--portfolio-font-mono,monospace);letter-spacing:.06em;margin-bottom:1.25rem}
.editorial-copy h2{font-size:var(--portfolio-h1,clamp(2.4rem,4.2vw,3.7rem));font-weight:600;letter-spacing:-.04em;line-height:1.04;max-width:12ch}
.editorial-description{color:var(--portfolio-text-secondary,#47544a);line-height:1.65;margin-top:1.25rem;max-width:34ch}
.editorial-footer{color:var(--portfolio-text-muted,#637067);font-size:var(--portfolio-label,.75rem)}
.editorial-line{background:var(--portfolio-border);height:1px;width:34%}
@media (max-width: 760px){.login-page[data-v-e5bd43b9]{min-height:auto;padding-block:1.5rem 2.5rem}.login-shell[data-v-e5bd43b9]{grid-template-columns:1fr;min-height:0}.login-panel[data-v-e5bd43b9]{padding:clamp(1.5rem,7vw,2.5rem)}.brand-mark[data-v-e5bd43b9]{margin-bottom:1.4rem}.editorial-panel[data-v-e5bd43b9]{min-height:260px;padding:1.5rem}.editorial-copy[data-v-e5bd43b9]{padding:2.5rem 0}.editorial-copy h2[data-v-e5bd43b9]{font-size:var(--portfolio-h2,clamp(1.75rem,3vw,2.5rem));max-width:16ch}}
@media (max-width: 360px){.login-page[data-v-e5bd43b9]{padding-inline:.75rem}.login-panel[data-v-e5bd43b9]{padding:1.25rem}.telegram-button[data-v-e5bd43b9]{font-size:var(--portfolio-small,.875rem);padding-inline:.5rem}}
@media (prefers-reduced-motion: reduce){[data-v-e5bd43b9],[data-v-e5bd43b9]:after,[data-v-e5bd43b9]:before{scroll-behavior:auto!important;transition-duration:.01ms!important}}
</style>
