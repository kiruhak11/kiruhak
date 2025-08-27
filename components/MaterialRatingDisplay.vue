<template>
  <div class="rating-display">
    <span class="rating-number">{{ displayRating.toFixed(1) }}</span>
    <div class="rating-stars">
      <svg
        v-for="star in 5"
        :key="star"
        class="star-icon"
        :class="{
          'star-filled': star <= Math.round(displayRating),
          'star-empty': star > Math.round(displayRating),
        }"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        />
      </svg>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  avgRating: {
    type: Number,
    default: 0,
  },
  ratingCount: {
    type: Number,
    default: 0,
  },
});

// Создаем реактивную переменную для отображения рейтинга
const displayRating = computed(() => props.avgRating);
const displayCount = computed(() => props.ratingCount);
</script>

<style lang="scss" scoped>
.rating-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  text-align: center;
}

.rating-number {
  font-weight: 600;
  color: var(--color-text);
  font-size: 1.2rem;
  line-height: 1;
}

.rating-stars {
  display: flex;
  gap: 0.125rem;
}

.star-icon {
  transition: all 0.2s ease;
}

.star-filled {
  color: #fbbf24;
}

.star-empty {
  color: #d1d5db;
}
</style>
