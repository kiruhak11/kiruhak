<template>
  <div class="admin-layout">
    <AdminNavigation />
    <main class="lead-inbox">
      <header class="inbox-header">
        <div>
          <h1>Заявки</h1>
          <p>Заявки с сайта и доставка уведомлений в Telegram</p>
        </div>
        <button class="button" type="button" :disabled="loading" @click="refresh">
          {{ loading ? "Обновляем…" : "Обновить" }}
        </button>
      </header>

      <div v-if="counts" class="delivery-totals" aria-live="polite">
        <div class="delivery-total">
          <strong>{{ counts.undelivered }}</strong>
          <span>Без подтверждённой доставки</span>
        </div>
        <div class="delivery-total" :class="{ 'delivery-total--attention': counts.failed > 0 }">
          <strong>{{ counts.failed }}</strong>
          <span>Требуют проверки</span>
        </div>
      </div>

      <div class="inbox-toolbar">
        <label>
          Статус доставки
          <select v-model="filter" :disabled="loading" @change="changeFilter">
            <option value="">Все статусы</option>
            <option v-for="status in LEAD_STATUSES" :key="status" :value="status">
              {{ LEAD_STATUS_LABELS[status] }}
            </option>
          </select>
        </label>
        <span v-if="data" class="secondary-text">Всего {{ data.total }}</span>
      </div>
      <p v-if="notice" class="notice" role="status">{{ notice }}</p>
      <p v-if="loadError" class="notice notice--error" role="alert">{{ loadError }}</p>
      <div v-else-if="loading && !data" class="empty" role="status">Загружаем заявки…</div>
      <template v-else-if="data">
        <ul v-if="data.leads.length" class="lead-list" aria-label="Список заявок">
          <li v-for="lead in data.leads" :key="lead.id" class="lead-row">
            <div class="lead-main">
              <h2>{{ lead.name }}</h2>
              <p class="secondary-text">{{ lead.email }}<template v-if="lead.business"> · {{ lead.business }}</template></p>
              <p class="task-preview">{{ lead.task }}</p>
            </div>
            <div class="lead-state">
              <span class="badge" :class="badgeClass(lead.status)">
                {{ deliveryLabel(lead) }}
              </span>
              <time class="secondary-text" :datetime="lead.createdAt">{{ dateLabel(lead.createdAt) }}</time>
            </div>
            <button class="button" type="button" :aria-label="`Открыть заявку от ${lead.name}`" @click="openLead(lead)">
              Открыть
            </button>
          </li>
        </ul>
        <p v-else class="empty">Заявок с выбранным статусом пока нет.</p>
        <nav v-if="maxPage > 1" class="pagination" aria-label="Страницы заявок">
          <button class="button" type="button" :disabled="loading || page === 1" @click="goToPage(page - 1)">Назад</button>
          <span>{{ page }} из {{ maxPage }}</span>
          <button class="button" type="button" :disabled="loading || page >= maxPage" @click="goToPage(page + 1)">Дальше</button>
        </nav>
      </template>

      <AdminDialog
        :model-value="Boolean(selected)"
        :title="selected ? `Заявка от ${selected.name}` : 'Заявка'"
        size="lg"
        @request-close="closeLead"
      >
        <template v-if="selected">
          <div class="detail-header">
            <span class="badge" :class="badgeClass(selected.status)">
              {{ deliveryLabel(selected) }}
            </span>
            <time class="secondary-text" :datetime="selected.createdAt">{{ dateLabel(selected.createdAt) }}</time>
          </div>
          <dl class="details-grid">
            <div><dt>Email</dt><dd>{{ selected.email }}</dd></div>
            <div><dt>Telegram или телефон</dt><dd>{{ selected.contact || "—" }}</dd></div>
            <div><dt>Ниша / компания</dt><dd>{{ selected.business || "—" }}</dd></div>
            <div><dt>Бюджет</dt><dd>{{ selected.budget || "—" }}</dd></div>
            <div><dt>ID заявки</dt><dd>{{ selected.id }}</dd></div>
            <div><dt>Попыток в текущем цикле</dt><dd>{{ selected.attemptCount }}</dd></div>
            <div v-if="selected.status === 'RETRY'"><dt>Следующая попытка</dt><dd>{{ dateLabel(selected.nextAttemptAt) }}</dd></div>
            <div v-if="selected.sentAt"><dt>Доставлена</dt><dd>{{ dateLabel(selected.sentAt) }}</dd></div>
            <div v-if="selected.telegramMessageId"><dt>ID сообщения Telegram</dt><dd>{{ selected.telegramMessageId }}</dd></div>
          </dl>
          <section class="lead-task">
            <h3>Задача</h3>
            <p>{{ selected.task }}</p>
          </section>
          <section v-if="selected.lastErrorCode" class="delivery-error">
            <h3>Последняя ошибка</h3>
            <p>{{ deliveryErrorLabel(selected.lastErrorCode) }}</p>
            <code>{{ selected.lastErrorCode }}</code>
          </section>
          <label v-if="confirmationRequired" class="retry-confirm">
            <input v-model="confirmed" type="checkbox" :disabled="retrying" />
            <span>Я проверил Telegram по ID заявки и не нашёл уведомление.</span>
          </label>
        </template>
        <template #footer>
          <div class="dialog-actions">
            <button class="button" type="button" :disabled="retrying" @click="closeLead">Закрыть</button>
            <button
              v-if="selected?.status === 'FAILED'"
              class="button button--primary"
              type="button"
              :disabled="retrying || (confirmationRequired && !confirmed)"
              @click="retryLead"
            >{{ retrying ? "Возвращаем в очередь…" : "Повторить доставку" }}</button>
          </div>
        </template>
      </AdminDialog>
    </main>
  </div>
</template>

<script setup lang="ts">
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  needsLeadDeliveryConfirmation,
  type AdminLead,
  type AdminLeadPage,
  type LeadStatus,
} from "~/types/admin-lead";

useHead({ title: "Заявки — K-Studio" });

const { apiFetch } = useApi();
const { counts, refreshLeadCounts } = useLeadDeliverySummary();
const data = ref<AdminLeadPage | null>(null);
const page = ref(1);
const filter = ref<LeadStatus | "">("");
const loading = ref(true);
const loadError = ref("");
const selected = ref<AdminLead | null>(null);
const confirmed = ref(false);
const retrying = ref(false);
const notice = ref("");

const maxPage = computed(() => data.value ? Math.max(1, Math.ceil(data.value.total / data.value.pageSize)) : 1);
const confirmationRequired = computed(() => selected.value?.status === "FAILED" &&
  needsLeadDeliveryConfirmation(selected.value.lastErrorCode));
const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium", timeStyle: "short",
});

function dateLabel(value: string) {
  return dateFormat.format(new Date(value));
}

function badgeClass(status: LeadStatus) {
  return `badge--${status.toLowerCase()}`;
}

function deliveryLabel(lead: AdminLead) {
  if (lead.lockedUntil && (lead.status === "PENDING" || lead.status === "RETRY")) return "В обработке";
  return LEAD_STATUS_LABELS[lead.status];
}

function deliveryErrorLabel(code: string) {
  if (code === "TELEGRAM_RATE_LIMIT") return "Telegram ограничил частоту отправки.";
  if (code === "TELEGRAM_TIMEOUT_UNCONFIRMED") return "Telegram не подтвердил отправку до истечения тайм-аута.";
  if (code === "WORKER_LEASE_UNCONFIRMED") return "Обработка прервалась до сохранения результата.";
  if (needsLeadDeliveryConfirmation(code)) return "Результат отправки неизвестен.";
  return "Уведомление не доставлено.";
}

async function loadLeads() {
  loading.value = true;
  loadError.value = "";
  try {
    const query = new URLSearchParams({ page: String(page.value) });
    if (filter.value) query.set("status", filter.value);
    data.value = await apiFetch<AdminLeadPage>(`/api/admin/leads?${query}`);
    if (page.value > maxPage.value) {
      page.value = maxPage.value;
      await loadLeads();
    }
  } catch {
    data.value = null;
    loadError.value = "Не удалось загрузить заявки. Обновите список.";
  } finally {
    loading.value = false;
  }
}

async function refresh() {
  await Promise.all([loadLeads(), refreshLeadCounts()]);
}

function goToPage(next: number) {
  page.value = next;
  void loadLeads();
}

function changeFilter() {
  goToPage(1);
}

function openLead(lead: AdminLead) {
  selected.value = lead;
  confirmed.value = false;
}

function closeLead() {
  if (!retrying.value) selected.value = null;
}

async function retryLead() {
  const lead = selected.value;
  if (!lead || lead.status !== "FAILED" || retrying.value || (confirmationRequired.value && !confirmed.value)) {
    return;
  }

  retrying.value = true;
  notice.value = "";
  try {
    await apiFetch(`/api/admin/leads/${encodeURIComponent(lead.id)}/retry`, {
      method: "POST",
      body: { updatedAt: lead.updatedAt, confirmed: confirmed.value },
      retry: 0,
    });
    selected.value = null;
    notice.value = "Заявка возвращена в очередь доставки.";
    await refresh();
  } catch {
    selected.value = null;
    await refresh();
    notice.value = "Повтор доставки не подтверждён. Проверьте текущий статус заявки.";
  } finally {
    retrying.value = false;
  }
}

onMounted(loadLeads);
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: var(--background-color);
  color: var(--color-text);
}
.lead-inbox {
  max-width: 1370px;
  margin-left: 250px;
  padding: clamp(20px, 4vw, 52px);
}
.inbox-header, .inbox-toolbar, .dialog-actions, .detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.inbox-header h1 { margin: 0; letter-spacing: -.04em; font-size: clamp(1.9rem, 4vw, 2.8rem); }
.inbox-header p, .secondary-text { color: var(--color-text-secondary); }
.inbox-header p { margin: 8px 0 0; }
.delivery-totals {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 30px 0;
}
.delivery-total, .lead-row, .empty {
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: var(--background-secondary);
}
.delivery-total { display: grid; gap: 6px; padding: 16px 19px; font-size: .88rem; }
.delivery-total strong { font-size: 1.8rem; line-height: 1; font-variant-numeric: tabular-nums; }
.delivery-total--attention {
  border-color: #c78a4c;
  background: color-mix(in srgb, #c78a4c 12%, var(--background-color));
}
.inbox-toolbar { margin: 22px 0 12px; font-size: .87rem; }
.inbox-toolbar label { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
.button, .inbox-toolbar select {
  min-height: 40px;
  padding: 8px 13px;
  border: 1px solid var(--border-color);
  border-radius: 9px;
  background: var(--background-color);
  color: var(--color-text);
  font: inherit;
  font-size: .88rem;
}
.button { font-weight: 650; cursor: pointer; }
.button:hover:not(:disabled) { border-color: var(--color-primary); }
.button:disabled { opacity: .55; cursor: not-allowed; }
.button--primary { background: #304db2; border-color: #304db2; color: #fff; }
.lead-list { display: grid; gap: 10px; list-style: none; margin: 0; padding: 0; }
.lead-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(135px, 24%) auto;
  align-items: center;
  gap: 16px;
  padding: 15px 17px;
}
.lead-main { min-width: 0; }
.lead-main h2 { margin: 0; font-size: 1rem; overflow-wrap: anywhere; }
.lead-main p { margin: 4px 0 0; font-size: .84rem; overflow-wrap: anywhere; }
.task-preview {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
.lead-state { display: grid; gap: 5px; justify-items: start; font-size: .8rem; }
.badge { display: inline-block; border-radius: 20px; padding: 4px 9px; font-size: .78rem; font-weight: 700; }
.badge--pending { background: #e2eafa; color: #253e75; }
.badge--retry { background: #fae7ca; color: #6d3508; }
.badge--failed { background: #f8dfdd; color: #8a2831; }
.badge--sent { background: #dcefe4; color: #20583b; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 16px; }
.notice, .empty { padding: 13px 15px; }
.notice { background: var(--background-secondary); border-radius: 9px; }
.notice--error { border: 1px solid #b7605b; }
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 20px;
  margin: 18px 0;
}
.details-grid dt { color: var(--color-text-secondary); font-size: .82rem; }
.details-grid dd { margin: 3px 0 0; overflow-wrap: anywhere; font-size: .94rem; }
.lead-task, .delivery-error { border-top: 1px solid var(--border-color); padding: 14px 0; }
.lead-task h3, .delivery-error h3 { margin: 0 0 8px; font-size: .95rem; }
.lead-task p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.delivery-error p { margin: 0 0 6px; }
.delivery-error code { font-size: .8rem; overflow-wrap: anywhere; }
.retry-confirm {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: .88rem;
  padding: 12px;
  border-radius: 9px;
  background: color-mix(in srgb, #c78a4c 15%, var(--background-color));
}
.dialog-actions { justify-content: flex-end; }

@media (max-width: 768px) {
  .lead-inbox { margin-left: 0; padding: 20px 16px 30px; }
}
@media (max-width: 540px) {
  .lead-row { grid-template-columns: minmax(0, 1fr) auto; gap: 10px; }
  .lead-main { grid-column: 1 / -1; }
  .delivery-totals { gap: 8px; }
  .delivery-total { padding: 12px; }
}
</style>
