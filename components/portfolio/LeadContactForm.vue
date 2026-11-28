<template>
  <div class="lead-form-wrap">
    <p class="lead-live" role="status">
      {{ isSubmitting ? "Отправляю заявку…" : isSuccess ? successText : "" }}
    </p>

    <div v-if="isSuccess" class="lead-success">
      <h3 ref="successHeading" class="lead-success-title" tabindex="-1">{{ successText }}</h3>
      <p class="lead-success-text">Отвечу по указанному контакту.</p>
      <button class="lead-button secondary" type="button" @click="openNewLead">Написать ещё</button>
    </div>

    <form v-else class="lead-form" :aria-label="ariaLabel" novalidate @submit.prevent="submitForm">
      <div class="lead-field">
        <label :for="`${idPrefix}-name`">Имя</label>
        <input
          :id="`${idPrefix}-name`"
          v-model="values.name"
          name="name"
          autocomplete="name"
          :maxlength="LEAD_FIELD_LIMITS.name"
          :aria-invalid="fieldErrors.name ? 'true' : undefined"
          :aria-describedby="fieldErrors.name ? `${idPrefix}-name-error` : undefined"
          :readonly="isSubmitting"
          required
          @input="handleInput('name')"
        />
        <p v-if="fieldErrors.name" :id="`${idPrefix}-name-error`" class="lead-message error">{{ fieldErrors.name }}</p>
      </div>

      <div class="lead-contact-fields">
        <div class="lead-field">
          <label :for="`${idPrefix}-method`">Способ связи</label>
          <select :id="`${idPrefix}-method`" v-model="replyMethod" :disabled="isSubmitting" @change="changeReplyMethod">
            <option value="telegram">Telegram</option>
            <option value="phone">Телефон</option>
            <option value="email">Электронная почта</option>
          </select>
        </div>
        <div class="lead-field">
          <label :for="`${idPrefix}-reply`">{{ replyField.label }}</label>
          <input
            :id="`${idPrefix}-reply`"
            :key="replyMethod"
            v-model="replyValues[replyMethod]"
            :name="replyKey"
            :type="replyField.type"
            :inputmode="replyField.inputmode"
            :autocomplete="replyField.autocomplete"
            :placeholder="replyField.placeholder"
            :maxlength="LEAD_FIELD_LIMITS[replyKey]"
            :aria-invalid="fieldErrors[replyKey] ? 'true' : undefined"
            :aria-describedby="fieldErrors[replyKey] ? `${idPrefix}-reply-error` : undefined"
            :readonly="isSubmitting"
            required
            @input="handleInput(replyKey)"
          />
          <p v-if="fieldErrors[replyKey]" :id="`${idPrefix}-reply-error`" class="lead-message error">{{ fieldErrors[replyKey] }}</p>
        </div>
      </div>

      <div class="lead-field">
        <label :for="`${idPrefix}-task`">Сообщение</label>
        <textarea
          :id="`${idPrefix}-task`"
          v-model="values.task"
          name="task"
          rows="4"
          :placeholder="taskHint"
          :maxlength="LEAD_FIELD_LIMITS.task"
          :aria-invalid="fieldErrors.task ? 'true' : undefined"
          :aria-describedby="fieldErrors.task ? `${idPrefix}-task-error` : undefined"
          :readonly="isSubmitting"
          required
          @input="onTaskInput"
        ></textarea>
        <p v-if="fieldErrors.task" :id="`${idPrefix}-task-error`" class="lead-message error">{{ fieldErrors.task }}</p>
      </div>

      <p class="lead-privacy-note">
        <NuxtLink to="/legal/privacy">Как обрабатываются данные</NuxtLink>
      </p>
      <p v-if="error && !hasFieldErrors" class="lead-message error" role="alert">{{ error.message }}</p>
      <button class="lead-button primary" type="submit" :aria-disabled="isSubmitting">
        {{ isSubmitting ? "Отправка…" : submitLabel }}
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import { useLeadSubmission } from "~/composables/useLeadSubmission";
import { LEAD_FIELD_LIMITS, type LeadReplyMethod } from "~/utils/lead-fields";
import { isLeadTopicDetached, resolveLeadTopic } from "~/utils/lead-topic";

const props = withDefaults(defineProps<{
  idPrefix?: string;
  submitLabel?: string;
  ariaLabel?: string;
  topic?: string;
  topicId?: string;
  taskHint?: string;
}>(), {
  idPrefix: "lead",
  submitLabel: "Отправить заявку",
  ariaLabel: "Форма заявки",
  topic: "",
  topicId: "",
  taskHint: "Расскажите о задаче и желаемых сроках",
});

const emit = defineEmits<{
  "topic-applied": [id: string];
  "topic-detached": [];
}>();

const { values, error, result, isSubmitting, isSuccess, fieldErrors, submit, handleInput, startNewLead } = useLeadSubmission();
const replyMethod = ref<LeadReplyMethod>("telegram");
const replyValues = reactive({ email: "", telegram: "", phone: "" });
const replyOptions = {
  telegram: { label: "Имя пользователя Telegram", type: "text", inputmode: "text", autocomplete: "off", placeholder: "@username" },
  phone: { label: "Номер телефона", type: "tel", inputmode: "tel", autocomplete: "tel", placeholder: "+7 900 000-00-00" },
  email: { label: "Электронная почта", type: "email", inputmode: "email", autocomplete: "email", placeholder: "name@example.com" },
} as const;
const replyField = computed(() => replyOptions[replyMethod.value]);
const replyKey = computed(() => replyMethod.value === "email" ? "email" : "contact");
const hasFieldErrors = computed(() => Object.keys(fieldErrors.value).length > 0);
const successText = computed(() => result.value?.duplicate ? "Заявка уже сохранена" : "Заявка сохранена");
const successHeading = ref<HTMLElement | null>(null);

const focusField = async (field: "name" | "reply" | "task") => {
  await nextTick();
  document.getElementById(`${props.idPrefix}-${field}`)?.focus();
};

const changeReplyMethod = () => {
  handleInput("email");
  handleInput("contact");
};

const submitForm = async () => {
  if (isSubmitting.value) return;
  const method = replyMethod.value;
  values.email = method === "email" ? replyValues.email : "";
  values.contact = method === "email" ? "" : replyValues[method];

  if (await submit(method)) {
    Object.assign(replyValues, { email: "", telegram: "", phone: "" });
    autoTopic.value = "";
    emit("topic-detached");
    await nextTick();
    successHeading.value?.focus();
    return;
  }

  if (fieldErrors.value.name) await focusField("name");
  else if (fieldErrors.value[replyKey.value]) await focusField("reply");
  else if (fieldErrors.value.task) await focusField("task");
};

const openNewLead = () => {
  startNewLead();
  void focusField("name");
};

const autoTopic = ref("");
watch(() => props.topic, (topic) => {
  const decision = resolveLeadTopic(values.task, autoTopic.value, topic);
  if (decision.action === "keep") return;
  values.task = decision.text;
  autoTopic.value = decision.text;
  emit("topic-applied", props.topicId);
}, { immediate: true });

const onTaskInput = () => {
  if (isLeadTopicDetached(values.task, autoTopic.value)) {
    autoTopic.value = "";
    emit("topic-detached");
  }
  handleInput("task");
};
</script>

<style scoped lang="scss">
.lead-form-wrap { min-width: 0; }
.lead-form { display: grid; gap: 1rem; padding: clamp(1.1rem, 3vw, 1.75rem); border: 1px solid var(--portfolio-border); border-radius: var(--portfolio-radius-lg); background: var(--portfolio-bg-elevated); box-shadow: var(--portfolio-shadow-soft); }
.lead-field { display: grid; align-content: start; min-width: 0; gap: 0.4rem; }
.lead-contact-fields { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); gap: 1rem; }
.lead-live { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.lead-field label { color: var(--portfolio-text); font-size: 0.88rem; font-weight: 600; }
.lead-form input,.lead-form textarea,.lead-form select { width: 100%; min-height: var(--portfolio-control-compact); border: 1px solid var(--portfolio-control-border); border-radius: var(--portfolio-radius-sm); padding: 0.7rem 0.8rem; background: var(--portfolio-bg); color: var(--portfolio-text); font: inherit; font-size: 1rem; scroll-margin-block: 6rem 1rem; }
.lead-form select { color-scheme: light; }
:global(.dark) .lead-form select { color-scheme: dark; }
.lead-form textarea { min-height: 112px; resize: vertical; }
.lead-form input::placeholder,.lead-form textarea::placeholder { color: var(--portfolio-text-muted); opacity: 1; }
.lead-form input:focus,.lead-form textarea:focus,.lead-form select:focus { outline: 2px solid var(--portfolio-accent); outline-offset: 2px; border-color: var(--portfolio-accent); }
.lead-form [aria-invalid="true"] { border-color: var(--portfolio-error); }
.lead-button[aria-disabled="true"] { cursor: wait; }
.lead-button { display: inline-flex; min-height: var(--portfolio-control-standard); justify-content: center; align-items: center; gap: 10px; padding: 0 18px; border: 1px solid transparent; border-radius: var(--portfolio-radius-sm); font-size: 0.92rem; font-weight: 650; text-decoration: none; cursor: pointer; transition: transform 160ms ease, background-color 160ms ease, border-color 160ms ease, color 160ms ease; }
.lead-button.primary { justify-self: start; border-color: var(--portfolio-accent); background: var(--portfolio-accent); color: var(--portfolio-accent-contrast); }
.lead-button.primary svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.7; }
.lead-button.secondary { justify-self: start; border-color: var(--portfolio-border); background: transparent; color: var(--portfolio-text); }
.lead-button:hover { transform: translateY(-1px); border-color: var(--portfolio-border-hover); }
.lead-button.primary:hover { border-color: var(--portfolio-accent-hover); background: var(--portfolio-accent-hover); }
.lead-button.secondary:hover { background: var(--portfolio-surface-hover); }
.lead-button:focus-visible { outline: 2px solid var(--portfolio-accent); outline-offset: 3px; }
.lead-message { margin: 0; font-size: var(--portfolio-small); line-height: 1.5; }
.lead-message.error { color: var(--portfolio-error); }
.lead-privacy-note { margin: 0; color: var(--portfolio-text-secondary); font-size: 0.82rem; line-height: 1.55; }
.lead-privacy-note a { color: var(--portfolio-accent); text-decoration: underline; text-underline-offset: 3px; }
.lead-privacy-note a:focus-visible { outline: 2px solid var(--portfolio-accent); outline-offset: 3px; }
.lead-success { display: grid; justify-items: start; gap: 0.55rem; padding: clamp(1.4rem, 3vw, 2rem); border: 1px solid var(--portfolio-border); border-radius: var(--portfolio-radius-lg); background: var(--portfolio-bg-elevated); box-shadow: var(--portfolio-shadow-soft); }
.lead-success-title:focus { outline: 2px solid var(--portfolio-accent); outline-offset: 4px; }
.lead-success-title { margin: 0.35rem 0 0; color: var(--portfolio-text); font-size: 1.2rem; font-weight: 650; letter-spacing: -0.03em; }
.lead-success-text { max-width: 52ch; margin: 0; color: var(--portfolio-text-secondary); font-size: 0.92rem; line-height: 1.6; }

@media (max-width: 520px) {
  .lead-button { width: 100%; }
  .lead-contact-fields { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .lead-button { transition: none; }
  .lead-button:hover { transform: none; }
}
</style>
