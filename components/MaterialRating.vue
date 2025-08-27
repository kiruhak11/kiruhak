<template>
  <div class="material-rating">
    <!-- Анимация благодарности -->
    <div v-if="showThankYou" class="thank-you-animation">
      <div class="thank-you-content">
        <div class="thank-you-icon">
          <MaterialIcons type="star" />
        </div>
        <div class="thank-you-text">Спасибо за оценку!</div>
      </div>
    </div>

    <div class="rating-stars">
      <button
        v-for="star in 5"
        :key="star"
        @click="rateMaterial(star)"
        @mouseenter="hoveredRating = star"
        @mouseleave="hoveredRating = 0"
        class="star-button"
        :class="{
          'star-filled': star <= (hoveredRating || userRating || 0),
          'star-empty': star > (hoveredRating || userRating || 0),
          'star-disabled': userRating.value > 0 && !hoveredRating,
        }"
        :disabled="loading"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="star-icon"
        >
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </svg>
      </button>
    </div>

    <div v-if="showStats" class="rating-stats">
      <div class="avg-rating-display">
        <span class="avg-rating-number">{{ avgRating.toFixed(1) }}</span>
        <div class="avg-rating-stars">
          <svg
            v-for="star in 5"
            :key="`avg-${star}`"
            class="avg-star-icon"
            :class="{
              'star-filled': star <= Math.round(avgRating),
              'star-empty': star > Math.round(avgRating),
            }"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
        </div>
      </div>
      <span class="rating-count">({{ ratingCount }} оценок)</span>
      <div v-if="userRating.value > 0" class="user-rating-info">
        <span class="user-rating-text">
          Ваша оценка: {{ userRating }}
          <MaterialIcons type="star" />
        </span>
      </div>
    </div>

    <div v-if="loading" class="rating-loading">
      <span class="loading-text">Сохранение...</span>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";

const props = defineProps({
  materialId: {
    type: String,
    required: true,
  },
  initialRating: {
    type: Number,
    default: 0,
  },
  avgRating: {
    type: Number,
    default: 0,
  },
  ratingCount: {
    type: Number,
    default: 0,
  },
  showStats: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["rating-changed", "already-rated"]);

const { apiFetch } = useApi();

const userRating = ref(props.initialRating);
const hoveredRating = ref(0);
const loading = ref(false);
const showThankYou = ref(false);

// Проверяем, оценивал ли пользователь уже этот материал
const hasRated = computed(() => userRating.value > 0);

const rateMaterial = async (rating) => {
  console.log("🔐 MaterialRating: Начало оценки", {
    rating,
    currentRating: userRating.value,
  });

  if (loading.value) return;

  // Если пользователь уже оценил материал, показываем сообщение
  if (userRating.value > 0) {
    console.log("🔐 MaterialRating: Пользователь уже оценил материал");
    alert(
      "Вы уже оценили этот материал. Оценку можно изменить только один раз."
    );
    return;
  }

  try {
    loading.value = true;
    console.log("🔐 MaterialRating: Отправка запроса на сервер");

    const response = await apiFetch(`/api/materials/${props.materialId}/rate`, {
      method: "POST",
      body: {
        rating,
      },
    });

    console.log("🔐 MaterialRating: Ответ сервера", response);

    if (response.success) {
      console.log("🔐 MaterialRating: Оценка успешно сохранена");
      userRating.value = rating;

      // Показываем анимацию благодарности
      console.log("🔐 MaterialRating: Показываем анимацию благодарности");
      showThankYou.value = true;
      setTimeout(() => {
        console.log("🔐 MaterialRating: Скрываем анимацию благодарности");
        showThankYou.value = false;
      }, 3000); // Скрываем через 3 секунды

      // Обновляем локальное состояние рейтинга
      const newAvgRating = calculateNewAvgRating(rating);
      console.log("🔐 MaterialRating: Отправляем событие rating-changed", {
        rating,
        materialId: props.materialId,
        newAvgRating,
        newRatingCount: props.ratingCount + 1,
      });

      emit("rating-changed", {
        rating,
        materialId: props.materialId,
        newAvgRating,
        newRatingCount: props.ratingCount + 1, // Всегда добавляем 1, так как это новая оценка
      });
    } else {
      console.error(
        "🔐 MaterialRating: Ошибка при оценке материала:",
        response.error
      );

      // Если пользователь уже оценил материал, не показываем alert
      if (response.error === "Вы уже оценили этот материал") {
        emit("already-rated", props.materialId);
      } else {
        alert(response.error || "Ошибка при оценке материала");
      }
    }
  } catch (error) {
    console.error("🔐 MaterialRating: Ошибка при оценке материала:", error);
  } finally {
    loading.value = false;
  }
};

// Функция для расчета нового среднего рейтинга
const calculateNewAvgRating = (newRating) => {
  const currentTotal = props.avgRating * props.ratingCount;
  const isNewRating = props.initialRating === 0;

  if (isNewRating) {
    // Новая оценка
    const newTotal = currentTotal + newRating;
    const newCount = props.ratingCount + 1;
    return newTotal / newCount;
  } else {
    // Обновление существующей оценки
    const newTotal = currentTotal - props.initialRating + newRating;
    return newTotal / props.ratingCount;
  }
};

// Обновляем рейтинг при изменении props
watch(
  () => props.initialRating,
  (newRating) => {
    console.log("🔐 MaterialRating: Props изменились", {
      oldRating: userRating.value,
      newRating,
    });
    userRating.value = newRating;
  }
);

// Отладочная информация при монтировании
onMounted(() => {
  console.log("🔐 MaterialRating: Компонент смонтирован", {
    materialId: props.materialId,
    initialRating: props.initialRating,
    avgRating: props.avgRating,
    ratingCount: props.ratingCount,
  });
});
</script>

<style lang="scss" scoped>
.material-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.thank-you-animation {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  animation: thankYouAppear 0.5s ease-out, thankYouFloat 3s ease-in-out;
  pointer-events: none;
}

.thank-you-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(251, 191, 36, 0.3);
  backdrop-filter: blur(10px);
}

.thank-you-icon {
  font-size: 2rem;
  animation: bounce 0.6s ease-in-out;
  color: white;

  :deep(svg) {
    width: 2rem;
    height: 2rem;
    fill: white;
  }
}

.thank-you-text {
  font-weight: 600;
  font-size: 1rem;
  text-align: center;
}

@keyframes thankYouAppear {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes thankYouFloat {
  0%,
  100% {
    transform: translate(-50%, -50%);
  }
  50% {
    transform: translate(-50%, -60%);
  }
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.rating-stars {
  display: flex;
  gap: 0.25rem;
}

.star-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: scale(1.1);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.star-icon {
  font-size: 1.2rem;
  transition: all 0.2s ease;
}

.star-filled .star-icon {
  color: #fbbf24;
  filter: drop-shadow(0 0 2px rgba(251, 191, 36, 0.5));
}

.star-empty .star-icon {
  color: #d1d5db;
}

.star-disabled .star-icon {
  opacity: 0.6;
  cursor: not-allowed;
}

.rating-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.avg-rating-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.avg-rating-number {
  font-weight: 600;
  color: var(--color-text);
  font-size: 1.1rem;
}

.avg-rating-stars {
  display: flex;
  gap: 0.125rem;
}

.avg-star-icon {
  transition: all 0.2s ease;
}

.rating-count {
  color: var(--color-text-secondary);
}

.user-rating-info {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(251, 191, 36, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.user-rating-text {
  color: #fbbf24;
  font-weight: 500;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 4px;

  :deep(svg) {
    width: 1rem;
    height: 1rem;
    fill: #fbbf24;
  }
}

.rating-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
