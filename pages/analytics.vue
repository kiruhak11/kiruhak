<template>
  <NuxtLayout>
    <div class="analytics-page">
      <div class="container">
        <div class="page-header">
          <div class="header-left">
            <h1>Аналитика сайтов</h1>
            <p>Отслеживайте посещения ваших сайтов</p>
          </div>
        </div>

        <!-- Форма добавления нового сайта -->
        <div class="add-site-form">
          <h2>Добавить новый сайт</h2>
          <form @submit.prevent="addSite">
            <div class="form-group">
              <label for="siteName">Название сайта</label>
              <input
                id="siteName"
                v-model="newSite.name"
                type="text"
                required
                placeholder="Мой сайт"
              />
            </div>

            <div class="form-group">
              <label for="siteDomain">Домен</label>
              <input
                id="siteDomain"
                v-model="newSite.domain"
                type="text"
                required
                placeholder="example.com"
              />
            </div>

            <div class="form-group">
              <label for="siteDescription">Описание (необязательно)</label>
              <textarea
                id="siteDescription"
                v-model="newSite.description"
                placeholder="Краткое описание сайта"
              ></textarea>
            </div>

            <button type="submit" :disabled="loading">
              {{ loading ? "Добавление..." : "Добавить сайт" }}
            </button>
          </form>
        </div>

        <!-- Список сайтов -->
        <div class="sites-list">
          <h2>Мои сайты</h2>
          <div v-if="sites.length === 0" class="no-sites">
            <p>У вас пока нет добавленных сайтов</p>
          </div>

          <div v-else class="sites-grid">
            <div
              v-for="site in sites"
              :key="site.id"
              class="site-card"
              @click="selectSite(site)"
            >
              <div class="site-info">
                <h3>{{ site.name }}</h3>
                <p class="domain">{{ site.domain }}</p>
                <p v-if="site.description" class="description">
                  {{ site.description }}
                </p>
              </div>

              <div class="site-stats">
                <div class="stat">
                  <span class="stat-number">{{
                    site.stats?.totalVisits || 0
                  }}</span>
                  <span class="stat-label">Посещений</span>
                </div>
                <div class="stat">
                  <span class="stat-number">{{
                    site.stats?.uniqueVisitors || 0
                  }}</span>
                  <span class="stat-label">Уникальных</span>
                </div>
              </div>

              <div class="tracking-code">
                <button
                  @click.stop="showTrackingCode(site)"
                  class="btn-secondary"
                >
                  Показать код
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Детальная статистика -->
        <div v-if="selectedSite" class="site-analytics">
          <h2>Статистика: {{ selectedSite.name }}</h2>

          <div class="period-selector">
            <button
              v-for="period in periods"
              :key="period.value"
              @click="changePeriod(period.value)"
              :class="{ active: currentPeriod === period.value }"
              class="period-btn"
            >
              {{ period.label }}
            </button>
          </div>

          <div v-if="analytics" class="analytics-grid">
            <!-- Общая статистика -->
            <div class="stats-cards">
              <div class="stat-card">
                <h3>Всего посещений</h3>
                <div class="stat-value">{{ analytics.totalVisits }}</div>
              </div>

              <div class="stat-card">
                <h3>Уникальных посетителей</h3>
                <div class="stat-value">{{ analytics.uniqueVisitors }}</div>
              </div>

              <div class="stat-card">
                <h3>Среднее время на сайте</h3>
                <div class="stat-value">
                  {{ formatTime(analytics.avgTimeOnSite) }}
                </div>
              </div>
            </div>

            <!-- Популярные страницы -->
            <div class="chart-section">
              <h3>Популярные страницы</h3>
              <div class="pages-list">
                <div
                  v-for="page in analytics.popularPages"
                  :key="page.page"
                  class="page-item"
                >
                  <span class="page-path">{{ page.page }}</span>
                  <span class="page-visits">{{ page.visits }}</span>
                </div>
              </div>
            </div>

            <!-- Источники трафика -->
            <div class="chart-section">
              <h3>Источники трафика</h3>
              <div class="sources-list">
                <div
                  v-for="source in analytics.trafficSources"
                  :key="source.referrer"
                  class="source-item"
                >
                  <span class="source-domain">{{
                    source.referrer || "Прямые переходы"
                  }}</span>
                  <span class="source-visits">{{ source.visits }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Модальное окно с кодом отслеживания -->
      <div v-if="showCodeModal" class="modal-overlay" @click="closeCodeModal">
        <div class="modal-content" @click.stop>
          <h3>Код отслеживания для {{ selectedSiteForCode?.name }}</h3>
          <p>Добавьте этот код в секцию &lt;head&gt; вашего сайта:</p>

          <div class="code-block">
            <pre><code>{{ selectedSiteForCode?.trackingCode }}</code></pre>
            <button @click="copyCode" class="copy-btn">
              {{ copied ? "Скопировано!" : "Копировать" }}
            </button>
          </div>

          <button @click="closeCodeModal" class="close-btn">Закрыть</button>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
// Импортируем composables
const {
  isAuthenticated,
  initAuth,
  refreshUser,
} = useAuth();
const router = useRouter();

// Состояние
const sites = ref([]);
const selectedSite = ref(null);
const selectedSiteForCode = ref(null);
const showCodeModal = ref(false);
const copied = ref(false);
const loading = ref(false);
const analytics = ref(null);
const currentPeriod = ref("7d");

// Инициализируем аутентификацию и загружаем сайты последовательно
onMounted(async () => {
  await initAuth();

  if (!isAuthenticated.value) {
    router.push("/login");
    return;
  }

  await refreshUser();
  await loadSites();
});

// Форма нового сайта
const newSite = ref({
  name: "",
  domain: "",
  description: "",
});

// Периоды для аналитики
const periods = [
  { value: "1d", label: "Сегодня" },
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "90d", label: "90 дней" },
];

// Загрузка сайтов
const loadSites = async () => {
  if (!isAuthenticated.value) {
    router.push("/login");
    return;
  }

  try {
    const { apiFetch } = useApi();
    const data = await apiFetch("/api/sites");
    sites.value = data || [];
  } catch (error) {
    console.error("Error loading sites:", error);
    if (error?.statusCode === 401 || error?.status === 401) {
      router.push("/login");
    }
  }
};

// Добавление нового сайта
const addSite = async () => {
  loading.value = true;
  try {
    const { apiFetch } = useApi();
    const data = await apiFetch("/api/sites", {
      method: "POST",
      body: newSite.value,
    });

    if (data?.success) {
      sites.value.push(data.site);
      newSite.value = { name: "", domain: "", description: "" };

      // Обновляем данные пользователя с сервера
      await refreshUser();
    } else if (data?.error) {
      alert(data.error);
    }
  } catch (error) {
    console.error("Error adding site:", error);
    alert("Ошибка при создании сайта");
  } finally {
    loading.value = false;
  }
};

// Выбор сайта для просмотра аналитики
const selectSite = async (site) => {
  selectedSite.value = site;
  await loadAnalytics(site.id);
};

// Загрузка аналитики
const loadAnalytics = async (siteId) => {
  try {
    const { apiFetch } = useApi();
    const data = await apiFetch(
      `/api/analytics/stats?siteId=${siteId}&period=${currentPeriod.value}`
    );
    analytics.value = data;
  } catch (error) {
    console.error("Error loading analytics:", error);
  }
};

// Изменение периода
const changePeriod = async (period) => {
  currentPeriod.value = period;
  if (selectedSite.value) {
    await loadAnalytics(selectedSite.value.id);
  }
};

// Показать код отслеживания
const showTrackingCode = (site) => {
  const trackingCode = [
    "<!-- Kiruhak Analytics -->",
    "<script>",
    `  window.KIRUHAK_SITE_ID = '${site.id}';`,
    "
</script>
", '
<script src="https://kiruhak11.ru/analytics.js"></script>
', "
<!-- End Kiruhak Analytics -->
", ].join("\n"); selectedSiteForCode.value = { ...site, trackingCode, };
showCodeModal.value = true; }; // Закрыть модальное окно const closeCodeModal =
() => { showCodeModal.value = false; selectedSiteForCode.value = null;
copied.value = false; }; // Копировать код const copyCode = async () => { try {
await navigator.clipboard.writeText(selectedSiteForCode.value.trackingCode);
copied.value = true; setTimeout(() => { copied.value = false; }, 2000); } catch
(error) { console.error("Error copying code:", error); } }; // Форматирование
времени const formatTime = (seconds) => { if (!seconds) return "0 сек"; const
minutes = Math.floor(seconds / 60); const remainingSeconds = seconds % 60;
return `${minutes}м ${remainingSeconds}с`; };

<style lang="scss" scoped>
.analytics-page {
  padding: 2rem 0;
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    gap: 2rem;

    .header-left {
      h1 {
        color: var(--color-text);
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      p {
        color: var(--color-text);
        font-size: 1.1rem;
        margin: 0;
      }
    }

    .header-right {
      .user-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        background: var(--background-color);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 1rem;
        min-width: 300px;

        .user-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .avatar-placeholder {
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: bold;
          }
        }

        .user-details {
          flex: 1;
          min-width: 0;

          .user-name {
            font-weight: 600;
            color: var(--color-text);
            margin-bottom: 0.25rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .user-balance {
            color: #667eea;
            font-weight: 500;
            font-size: 0.9rem;
          }
        }

        .logout-btn {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--color-text);
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s ease;

          &:hover {
            background: var(--border-color);
          }
        }
      }
    }
  }

  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;

      .header-right .user-info {
        min-width: auto;
      }
    }
  }
}

.add-site-form {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 3rem;

  h2 {
    margin-bottom: 1.5rem;
    color: var(--color-text);
  }

  .form-group {
    margin-bottom: 1rem;

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--color-text);
      font-weight: 500;
    }

    input,
    textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--background-color);
      color: var(--color-text);

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }
    }

    textarea {
      min-height: 100px;
      resize: vertical;
    }
  }

  button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.sites-list {
  h2 {
    margin-bottom: 1.5rem;
    color: var(--color-text);
  }

  .no-sites {
    text-align: center;
    padding: 3rem;
    color: var(--color-text);
  }

  .sites-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .site-card {
    background: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }

    .site-info {
      h3 {
        margin-bottom: 0.5rem;
        color: var(--color-text);
      }

      .domain {
        color: #667eea;
        font-weight: 500;
        margin-bottom: 0.5rem;
      }

      .description {
        color: var(--color-text);
        font-size: 0.9rem;
      }
    }

    .site-stats {
      display: flex;
      gap: 1rem;
      margin: 1rem 0;

      .stat {
        text-align: center;

        .stat-number {
          display: block;
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--color-text);
        }

        .stat-label {
          font-size: 0.8rem;
          color: var(--color-text);
        }
      }
    }

    .tracking-code {
      .btn-secondary {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--color-text);
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;

        &:hover {
          background: var(--border-color);
        }
      }
    }
  }
}

.site-analytics {
  margin-top: 3rem;

  h2 {
    margin-bottom: 1.5rem;
    color: var(--color-text);
  }

  .period-selector {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;

    .period-btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      background: transparent;
      color: var(--color-text);
      border-radius: 6px;
      cursor: pointer;

      &.active {
        background: #667eea;
        color: white;
        border-color: #667eea;
      }
    }
  }

  .analytics-grid {
    display: grid;
    gap: 2rem;
  }

  .stats-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;

    .stat-card {
      background: var(--background-color);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;

      h3 {
        margin-bottom: 1rem;
        color: var(--color-text);
        font-size: 0.9rem;
      }

      .stat-value {
        font-size: 2rem;
        font-weight: bold;
        color: var(--color-text);
      }
    }
  }

  .chart-section {
    background: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.5rem;

    h3 {
      margin-bottom: 1rem;
      color: var(--color-text);
    }

    .pages-list,
    .sources-list {
      .page-item,
      .source-item {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--border-color);

        &:last-child {
          border-bottom: none;
        }

        .page-path,
        .source-domain {
          color: var(--color-text);
        }

        .page-visits,
        .source-visits {
          color: var(--color-text);
          font-weight: 500;
        }
      }
    }
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .modal-content {
    background: var(--background-color);
    border-radius: 12px;
    padding: 2rem;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;

    h3 {
      margin-bottom: 1rem;
      color: var(--color-text);
    }

    .code-block {
      position: relative;
      margin: 1rem 0;

      pre {
        background: #1a1a1a;
        color: #fff;
        padding: 1rem;
        border-radius: 8px;
        overflow-x: auto;
        font-size: 0.9rem;
        line-height: 1.4;
      }

      .copy-btn {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: #667eea;
        color: white;
        border: none;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        cursor: pointer;
      }
    }

    .close-btn {
      background: var(--border-color);
      color: var(--color-text);
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      margin-top: 1rem;
    }
  }
}

@media (max-width: 768px) {
  .analytics-page {
    .sites-grid {
      grid-template-columns: 1fr;
    }

    .stats-cards {
      grid-template-columns: 1fr;
    }

    .period-selector {
      flex-wrap: wrap;
    }
  }
}
</style>
