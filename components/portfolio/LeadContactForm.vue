<template>
  <div class="lead-form-wrap">
    <div v-if="isSuccess" class="lead-success" role="status" aria-live="polite">
      <span class="lead-success-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="m5 13 4.5 4.5L19 7" /></svg>
      </span>
      <p class="lead-success-title">
        {{ result?.duplicate ? "Заявка уже сохранена" : "Заявка сохранена" }}
      </p>
      <p class="lead-success-text">
        {{
          result?.duplicate
            ? "Повторно отправлять не нужно — эта заявка уже сохранена."
            : "Заявка сохранена, уведомление поставлено в очередь. Я свяжусь с вами по указанным контактам."
        }}
      </p>
      <button class="lead-button secondary" type="button" @click="startNewLead">
        Отправить ещё одну заявку
      </button>
    </div>

    <form
      v-else
      class="lead-form"
      :aria-label="ariaLabel"
      novalidate
      @input="onInput"
      @submit.prevent="submit"
    >
      <div class="lead-field">
        <label :for="`${idPrefix}-name`">
          Имя <span class="lead-required" aria-hidden="true">*</span>
        </label>
        <input
          :id="`${idPrefix}-name`"
          v-model="values.name"
          type="text"
          name="name"
          autocomplete="name"
          :maxlength="LEAD_FIELD_LIMITS.name"
          required
          placeholder="Как к вам обращаться"
        />
      </div>

      <div class="lead-field">
        <label :for="`${idPrefix}-contact`">Telegram или телефон</label>
        <input
          :id="`${idPrefix}-contact`"
          v-model="values.contact"
          type="text"
          name="contact"
          autocomplete="tel"
          inputmode="tel"
          :maxlength="LEAD_FIELD_LIMITS.contact"
          placeholder="@username или +7 900 000-00-00"
        />
        <p class="lead-hint">Необязательно, но так быстрее ответить.</p>
      </div>

      <div class="lead-field">
        <label :for="`${idPrefix}-email`">
          Email для ответа <span class="lead-required" aria-hidden="true">*</span>
        </label>
        <input
          :id="`${idPrefix}-email`"
          v-model="values.email"
          type="email"
          name="email"
          autocomplete="email"
          inputmode="email"
          :maxlength="LEAD_FIELD_LIMITS.email"
          required
          placeholder="name@example.com"
        />
      </div>

      <div class="lead-field">
        <label :for="`${idPrefix}-business`">Ниша / компания</label>
        <input
          :id="`${idPrefix}-business`"
          v-model="values.business"
          type="text"
          name="business"
          autocomplete="organization"
          :maxlength="LEAD_FIELD_LIMITS.business"
          placeholder="Например: юридические услуги"
        />
      </div>

      <div class="lead-field">
        <label :for="`${idPrefix}-task`">
          Что нужно сделать <span class="lead-required" aria-hidden="true">*</span>
        </label>
        <textarea
          :id="`${idPrefix}-task`"
          v-model="values.task"
          name="task"
          rows="4"
          :maxlength="LEAD_FIELD_LIMITS.task"
          required
          placeholder="Задача, ожидаемый результат и сроки"
        ></textarea>
      </div>

      <div class="lead-field">
        <label :for="`${idPrefix}-budget`">Ориентировочный бюджет</label>
        <input
          :id="`${idPrefix}-budget`"
          v-model="values.budget"
          type="text"
          name="budget"
          :maxlength="LEAD_FIELD_LIMITS.budget"
          placeholder="Например: от 150 000 ₽"
        />
      </div>

      <p class="lead-privacy-note">
        Отправляя заявку, вы просите меня связаться с вами и обсудить проект.
        <NuxtLink to="/legal/privacy">Как обрабатываются данные</NuxtLink>.
      </p>

      <button
        class="lead-button primary"
        type="submit"
        :disabled="isSubmitting"
        :aria-busy="isSubmitting"
      >
        {{ isSubmitting ? "Отправка..." : submitLabel }}
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>
      </button>

      <p v-if="errorMessage" class="lead-message error" role="alert">
        {{ errorMessage }}
      </p>
      <p v-else class="lead-message hint">
        Поля, отмеченные <span aria-hidden="true">*</span>, обязательны.
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  LEAD_FIELD_LIMITS,
  useLeadSubmission,
} from "~/composables/useLeadSubmission";
import { isLeadTopicDetached, resolveLeadTopic } from "~/utils/lead-topic";

const props = withDefaults(
  defineProps<{
    /** Префикс идентификаторов полей — на странице форма может быть одна. */
    idPrefix?: string;
    submitLabel?: string;
    ariaLabel?: string;
    /**
     * Тема обращения: подставляется в описание задачи, если посетитель ещё
     * ничего не написал. Отдельного поля в API не добавляет.
     */
    topic?: string;
    /** Идентификатор темы — чтобы страница знала, какая тема применена. */
    topicId?: string;
  }>(),
  {
    idPrefix: "lead",
    submitLabel: "Отправить заявку",
    ariaLabel: "Заявка на разработку",
    topic: "",
    topicId: "",
  }
);

const emit = defineEmits<{
  /** Тема применена к описанию задачи. */
  "topic-applied": [id: string];
  /** Посетитель изменил описание задачи — тема больше не действует. */
  "topic-detached": [];
}>();

const {
  values,
  error,
  result,
  isSubmitting,
  isSuccess,
  submit,
  handleInput,
  startNewLead,
} = useLeadSubmission();

const errorMessage = computed(() => error.value?.message ?? "");

// Текст, подставленный автоматически. Он отличается от написанного
// посетителем: только такой текст заменяется при выборе другой темы.
const autoTopic = ref("");

watch(
  () => props.topic,
  (topic) => {
    const decision = resolveLeadTopic(values.task, autoTopic.value, topic ?? "");

    if (decision.action === "keep") {
      // Описание задачи написал посетитель — его текст не затирается,
      // и тема не считается применённой.
      return;
    }

    values.task = decision.text;
    autoTopic.value = decision.text;
    emit("topic-applied", props.topicId);
  },
  { immediate: true }
);

/**
 * Ручная правка описания задачи. Если посетитель убрал автоматически
 * подставленную тему, тема больше не действует — иначе выбранная кнопка
 * противоречила бы содержимому поля.
 */
const onInput = () => {
  if (isLeadTopicDetached(values.task, autoTopic.value)) {
    autoTopic.value = "";
    emit("topic-detached");
  }
  handleInput();
};
</script>

<style scoped lang="scss">
.lead-form-wrap { min-width: 0; }
.lead-form { display: grid; gap: 1rem; padding: clamp(1.1rem, 3vw, 1.75rem); border: 1px solid var(--portfolio-border); border-radius: var(--portfolio-radius-lg); background: var(--portfolio-bg-elevated); box-shadow: var(--portfolio-shadow-soft); }
.lead-field { display: grid; gap: 0.45rem; }
.lead-field label { color: var(--portfolio-text); font-size: 0.88rem; font-weight: 600; }
.lead-required { color: var(--portfolio-accent); }
.lead-hint { margin: 0; color: var(--portfolio-text-muted); font-size: 0.78rem; line-height: 1.45; }
.lead-form input,.lead-form textarea { width: 100%; min-height: var(--portfolio-control-compact); border: 1px solid var(--portfolio-border); border-radius: var(--portfolio-radius-sm); padding: 0.7rem 0.8rem; background: var(--portfolio-bg); color: var(--portfolio-text); font: inherit; font-size: 0.95rem; }
.lead-form textarea { min-height: 112px; resize: vertical; }
.lead-form input::placeholder,.lead-form textarea::placeholder { color: var(--portfolio-text-muted); opacity: 1; }
.lead-form input:focus-visible,.lead-form textarea:focus-visible { outline: 2px solid var(--portfolio-accent); outline-offset: 2px; border-color: var(--portfolio-accent); }
.lead-button { display: inline-flex; min-height: var(--portfolio-control-standard); justify-content: center; align-items: center; gap: 10px; padding: 0 18px; border: 1px solid transparent; border-radius: var(--portfolio-radius-sm); font-size: 0.92rem; font-weight: 650; text-decoration: none; cursor: pointer; transition: transform 160ms ease, background-color 160ms ease, border-color 160ms ease, color 160ms ease; }
.lead-button.primary { justify-self: start; border-color: var(--portfolio-accent); background: var(--portfolio-accent); color: var(--portfolio-accent-contrast); }
.lead-button.primary svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.7; }
.lead-button.secondary { justify-self: start; border-color: var(--portfolio-border); background: transparent; color: var(--portfolio-text); }
.lead-button:hover { transform: translateY(-1px); border-color: var(--portfolio-border-hover); }
.lead-button.primary:hover { border-color: var(--portfolio-accent-hover); background: var(--portfolio-accent-hover); }
.lead-button.secondary:hover { background: var(--portfolio-surface-hover); }
.lead-button:focus-visible { outline: 2px solid var(--portfolio-accent); outline-offset: 3px; }
.lead-button:disabled { cursor: not-allowed; opacity: 0.65; transform: none; }
.lead-message { margin: 0; font-size: var(--portfolio-small); line-height: 1.5; }
.lead-message.error { color: var(--portfolio-error); }
.lead-message.hint { color: var(--portfolio-text-muted); }
.lead-privacy-note { margin: 0; color: var(--portfolio-text-secondary); font-size: 0.82rem; line-height: 1.55; }
.lead-privacy-note a { color: var(--portfolio-accent); text-underline-offset: 3px; }
.lead-success { display: grid; justify-items: start; gap: 0.55rem; padding: clamp(1.4rem, 3vw, 2rem); border: 1px solid var(--portfolio-border); border-radius: var(--portfolio-radius-lg); background: var(--portfolio-bg-elevated); box-shadow: var(--portfolio-shadow-soft); }
.lead-success-mark { display: grid; width: 40px; height: 40px; place-items: center; border-radius: 50%; background: var(--portfolio-success); color: var(--portfolio-bg); }
.lead-success-mark svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; }
.lead-success-title { margin: 0.35rem 0 0; color: var(--portfolio-text); font-size: 1.2rem; font-weight: 650; letter-spacing: -0.03em; }
.lead-success-text { max-width: 52ch; margin: 0; color: var(--portfolio-text-secondary); font-size: 0.92rem; line-height: 1.6; }

@media (max-width: 520px) {
  .lead-button { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .lead-button { transition: none; }
  .lead-button:hover { transform: none; }
}
</style>
