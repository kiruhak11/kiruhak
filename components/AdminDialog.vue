<template>
  <Teleport to="body">
    <div v-if="modelValue" class="admin-dialog-backdrop" @mousedown.self="onBackdrop">
      <section ref="dialog" class="admin-dialog" :class="`admin-dialog--${size}`" role="dialog" aria-modal="true" :aria-labelledby="titleId" :aria-describedby="description ? descriptionId : undefined" tabindex="-1" @keydown="onKeydown">
        <header class="admin-dialog__header">
          <div><h2 :id="titleId">{{ title }}</h2><p v-if="description" :id="descriptionId">{{ description }}</p></div>
          <button class="admin-dialog__close" type="button" aria-label="Закрыть окно" @click="$emit('request-close')">×</button>
        </header>
        <div class="admin-dialog__body"><slot /></div>
        <footer v-if="$slots.footer" class="admin-dialog__footer"><slot name="footer" /></footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, useId, watch } from "vue";
const props = withDefaults(defineProps<{ modelValue: boolean; title: string; description?: string; size?: "sm" | "md" | "lg" | "xl"; closeOnBackdrop?: boolean }>(), { description: "", size: "md", closeOnBackdrop: true });
const emit = defineEmits<{ "request-close": [] }>();
const dialog = ref<HTMLElement | null>(null);
const instanceId = useId();
const titleId = `admin-dialog-title-${instanceId}`;
const descriptionId = `admin-dialog-description-${instanceId}`;
let previousFocus: HTMLElement | null = null;
let previousOverflow = "";
const focusable = () => [...(dialog.value?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])];
watch(() => props.modelValue, async (open) => {
  if (!import.meta.client) return;
  if (open) {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    await nextTick();
    (focusable()[0] ?? dialog.value)?.focus();
  } else {
    document.body.style.overflow = previousOverflow;
    previousFocus?.focus();
  }
}, { immediate: true });
function onBackdrop() { if (props.closeOnBackdrop) emit("request-close"); }
function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") { event.preventDefault(); emit("request-close"); return; }
  if (event.key !== "Tab") return;
  const items = focusable();
  if (!items.length) { event.preventDefault(); dialog.value?.focus(); return; }
  const first = items[0], last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}
onBeforeUnmount(() => { if (!import.meta.client) return; document.body.style.overflow = previousOverflow; previousFocus?.focus(); });
</script>

<style scoped>
.admin-dialog-backdrop{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:24px;background:rgba(10,14,22,.58);backdrop-filter:blur(8px)}
.admin-dialog{width:min(100%,560px);max-height:min(90dvh,900px);display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--border-color);border-radius:20px;background:var(--background-color);color:var(--color-text);box-shadow:0 30px 90px rgba(0,0,0,.28);outline:none}
.admin-dialog--sm{max-width:440px}.admin-dialog--lg{max-width:1000px}.admin-dialog--xl{max-width:1120px}
.admin-dialog__header{position:sticky;top:0;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:22px 26px;border-bottom:1px solid var(--border-color);background:var(--background-color)}
.admin-dialog__header h2{margin:0;font-size:1.25rem}.admin-dialog__header p{margin:6px 0 0;color:var(--color-text-secondary);font-size:.9rem}
.admin-dialog__close{width:36px;height:36px;flex:none;border:1px solid var(--border-color);border-radius:10px;background:transparent;color:inherit;font-size:24px;cursor:pointer}
.admin-dialog__body{min-height:0;overflow:auto;padding:24px 26px}.admin-dialog__footer{position:sticky;bottom:0;padding:16px 26px;border-top:1px solid var(--border-color);background:var(--background-color)}
@media(max-width:640px){.admin-dialog-backdrop{display:block;padding:0}.admin-dialog,.admin-dialog--sm,.admin-dialog--md,.admin-dialog--lg,.admin-dialog--xl{width:100%;height:100dvh;max-height:100dvh;border:0;border-radius:0}.admin-dialog__header{padding:calc(env(safe-area-inset-top) + 14px) 18px 16px}.admin-dialog__body{padding:18px}.admin-dialog__footer{padding:12px 18px calc(env(safe-area-inset-bottom) + 12px)}}
</style>
