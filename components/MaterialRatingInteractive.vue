<template>
  <div class="rating-interactive">
    <span class="rating-number">{{ avgRating.toFixed(1) }}</span>
    <div class="rating-stars">
      <button
        v-for="star in 5"
        :key="star"
        @click="rateMaterial(star)"
        @mouseenter="hoveredRating = star"
        @mouseleave="hoveredRating = 0"
        class="star-button"
        :class="{
          'star-filled': star <= (hoveredRating || Math.round(avgRating)),
          'star-empty': star > (hoveredRating || Math.round(avgRating)),
        }"
        :disabled="loading"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </svg>
      </button>
    </div>
    <span class="rating-count">({{ ratingCount }})</span>
    <div v-if="loading" class="rating-loading">
      <span class="loading-dot"></span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  materialId: {
    type: String,
    required: true,
  },
  avgRating: {
    type: Number,
    default: 0,
  },
  ratingCount: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["rating-changed"]);

const { apiFetch } = useApi();

const hoveredRating = ref(0);
const loading = ref(false);

const rateMaterial = async (rating) => {
  if (loading.value) return;

  try {
    loading.value = true;

    const response = await apiFetch(`/api/materials/${props.materialId}/rate`, {
      method: "POST",
      body: {
        rating,
      },
    });

    if (response.success) {
      emit("rating-changed", { rating, materialId: props.materialId });
    } else {
      console.error("Ошибка при оценке материала:", response.error);
    }
  } catch (error) {
    console.error("Ошибка при оценке материала:", error);
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.rating-interactive {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  position: relative;
}

.rating-number {
  font-weight: 600;
  color: var(--color-text);
  min-width: 1.5rem;
}

.rating-stars {
  display: flex;
  gap: 0.125rem;
}

.star-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.125rem;
  border-radius: 2px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    transform: scale(1.1);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.star-filled {
  color: #fbbf24;
}

.star-empty {
  color: #d1d5db;
}

.rating-count {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.rating-loading {
  position: absolute;
  right: -1.5rem;
  top: 50%;
  transform: translateY(-50%);
}

.loading-dot {
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: var(--color-accent);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}
</style>
