<template>
  <img
    v-if="visible && isUsableProjectPreview(src)"
    :src="src"
    :alt="alt"
    :class="imgClass"
    loading="lazy"
    @error="visible = false"
  />
  <div
    v-else
    :class="['image-fallback', fallbackClass]"
    role="img"
    :aria-label="`${alt}: превью недоступно`"
  >
    <span class="preview-mark" aria-hidden="true">PROJECT</span>
    <span class="preview-title">{{ alt }}</span>
  </div>
</template>

<script setup lang="ts">
import { isUsableProjectPreview } from "~/utils/project-links";

withDefaults(
  defineProps<{
    src?: string | null;
    alt: string;
    imgClass?: string;
    fallbackClass?: string;
  }>(),
  { src: "", imgClass: "", fallbackClass: "" }
);

const visible = ref(true);
</script>

<style scoped lang="scss">
.preview-mark,
.preview-title {
  position: relative;
  z-index: 1;
}

.preview-mark {
  color: var(--color-accent);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.preview-title {
  max-width: min(80%, 22rem);
  color: var(--color-text);
  font-size: clamp(0.85rem, 2vw, 1.1rem);
  font-weight: 700;
  text-align: center;
}

.image-fallback {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 140px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  overflow: hidden;
  padding: 1rem;
  background:
    radial-gradient(circle at 20% 20%, rgba(83, 156, 192, 0.22), transparent 42%),
    linear-gradient(140deg, var(--background-color-secondary), var(--background-color));
}
</style>
