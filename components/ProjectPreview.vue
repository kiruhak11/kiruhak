<template>
  <div class="preview" :class="{ 'preview--missing': !cover || failed }">
    <img
      v-if="cover && !failed"
      :key="cover.src"
      ref="imageElement"
      :src="cover.src"
      :alt="alt"
      :class="imgClass"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : 'auto'"
      :width="cover.width"
      :height="cover.height"
      decoding="async"
      @error="markFailed"
    />
    <div v-else :class="['image-fallback', fallbackClass]" :aria-hidden="!alt || undefined">
      <span class="preview-title">{{ title || alt }}</span>
      <span class="preview-note">Превью недоступно</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getPortfolioCover } from "~/constants/portfolio-publications";

const props = withDefaults(defineProps<{
  src?: string | null;
  alt?: string;
  title?: string;
  imgClass?: string;
  fallbackClass?: string;
  priority?: boolean;
}>(), { src: "", alt: "", title: "", imgClass: "", fallbackClass: "", priority: false });

const cover = computed(() => getPortfolioCover(props.src));
const imageElement = ref<HTMLImageElement | null>(null);
const failed = ref(false);

watch(cover, () => { failed.value = false; });
function markFailed(event: Event) {
  if (event.currentTarget === imageElement.value) failed.value = true;
}

function detectCachedError() {
  const image = imageElement.value;
  if (image?.complete && image.naturalWidth === 0) failed.value = true;
}

onMounted(detectCachedError);
watch(imageElement, detectCachedError, { flush: "post" });
</script>

<style scoped>
.preview {
  display: grid;
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 0;
  place-items: center;
  overflow: hidden;
  background: var(--portfolio-surface-hover);
}
.preview > img { display: block; width: 100%; height: 100%; min-height: 0; object-fit: contain; }
.preview--missing {
  background: radial-gradient(ellipse at 15% 0%, var(--portfolio-grid), transparent 58%), var(--portfolio-surface-hover);
}
.image-fallback {
  display: grid;
  width: 100%;
  height: 100%;
  align-content: center;
  justify-items: center;
  gap: .55rem;
  padding: 1rem;
  text-align: center;
}
.preview-title {
  max-width: 25ch;
  color: var(--portfolio-text);
  font-size: clamp(1rem, 2.8vw, 1.6rem);
  font-weight: 650;
  letter-spacing: -.04em;
  line-height: 1.15;
  overflow-wrap: anywhere;
}
.preview-note { color: var(--portfolio-text-secondary); font-size: .75rem; }
</style>
