<template>
  <div
    v-if="showGiftIcon"
    class="gift-icon"
    @click="openDiscountModal"
    :class="{ 'gift-icon--visible': showGiftIcon }"
  >
    <div class="gift-icon__wrapper">
      <svg
        class="gift-icon__svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 12V22H4V12"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M22 7H2V12H22V7Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M12 22V7"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <div class="gift-icon__discount">{{ savedDiscount }}%</div>
    </div>
    <div class="gift-icon__tooltip">Ваша скидка {{ savedDiscount }}%</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";

const props = defineProps<{
  show: boolean;
  discount: number;
}>();

const emit = defineEmits(["open-modal"]);

const showGiftIcon = ref(false);
const savedDiscount = ref(0);

const STORAGE_KEY = "saved_discount";
const USED_DISCOUNT_KEY = "used_discount";

onMounted(() => {
  checkSavedDiscount();

  // Слушаем изменения в localStorage
  window.addEventListener("storage", handleStorageChange);
});

onUnmounted(() => {
  window.removeEventListener("storage", handleStorageChange);
});

watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      // Когда модалка открывается, скрываем иконку
      showGiftIcon.value = false;
    } else {
      // Когда модалка закрывается, проверяем, не была ли скидка использована
      setTimeout(() => {
        checkSavedDiscount();
      }, 100);
    }
  }
);

watch(
  () => props.discount,
  (newValue) => {
    if (newValue > 0) {
      saveDiscount(newValue);
    }
  }
);

const checkSavedDiscount = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  const used = localStorage.getItem(USED_DISCOUNT_KEY);

  if (saved && !used) {
    const discountData = JSON.parse(saved);
    const now = Date.now();

    // Проверяем, не истекла ли скидка (7 дней)
    if (now - discountData.timestamp < 7 * 24 * 60 * 60 * 1000) {
      savedDiscount.value = discountData.value;
      showGiftIcon.value = true;
    } else {
      // Удаляем истекшую скидку
      localStorage.removeItem(STORAGE_KEY);
    }
  }
};

const saveDiscount = (discount: number) => {
  const discountData = {
    value: discount,
    timestamp: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(discountData));
  savedDiscount.value = discount;

  // Добавляем небольшую задержку для анимации
  setTimeout(() => {
    showGiftIcon.value = true;
    playNotificationSound();
  }, 500);
};

const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.3
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    // Игнорируем ошибки аудио
  }
};

const openDiscountModal = () => {
  // Добавляем анимацию клика
  const wrapper = document.querySelector(".gift-icon__wrapper");
  if (wrapper) {
    wrapper.style.transform = "scale(0.9)";
    wrapper.style.animation = "giftClick 0.15s ease-in-out";
    setTimeout(() => {
      wrapper.style.transform = "";
      wrapper.style.animation = "";
    }, 150);
  }

  emit("open-modal", savedDiscount.value);
};

const handleStorageChange = (event: StorageEvent) => {
  if (event.key === USED_DISCOUNT_KEY) {
    // Скидка была использована, скрываем иконку с анимацией
    hideGiftIcon();
  }
};

const hideGiftIcon = () => {
  const icon = document.querySelector(".gift-icon");
  if (icon) {
    icon.style.animation = "giftDisappear 0.3s ease forwards";
    setTimeout(() => {
      showGiftIcon.value = false;
    }, 300);
  } else {
    showGiftIcon.value = false;
  }
};
</script>

<style scoped lang="scss">
.gift-icon {
  position: fixed;
  bottom: 30px;
  left: 30px;
  z-index: 1000;
  cursor: pointer;
  transform: scale(0);
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  animation: slideInLeft 0.5s ease forwards 0.3s;

  &--visible {
    transform: scale(1);
    animation: giftAppear 0.5s ease forwards;
  }

  &:hover {
    transform: scale(1.1);

    .gift-icon__tooltip {
      opacity: 1;
      transform: translateY(-10px);
    }

    .gift-icon__wrapper {
      animation: none;

      &::before {
        animation: none;
        opacity: 0.6;
      }

      .gift-icon__svg {
        animation: giftIconWiggle 0.5s ease-in-out infinite;
      }
    }
  }
}

.gift-icon__wrapper {
  position: relative;
  width: 60px;
  height: 60px;
  background: var(--gradient-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  animation: bounce 2s infinite;
  transition: all 0.3s ease, transform 0.15s ease;

  &::before {
    content: "";
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: var(--gradient-primary);
    border-radius: 50%;
    opacity: 0.3;
    z-index: -1;
    animation: pulse 2s infinite;
  }
}

.gift-icon__svg {
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.gift-icon__discount {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  font-size: 12px;
  font-weight: bold;
  padding: 4px 6px;
  border-radius: 10px;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  animation: discountPulse 2s ease-in-out infinite;
}

.gift-icon__tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(0);
  background: var(--background-color);
  color: var(--color-text);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  white-space: nowrap;
  opacity: 0;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  margin-bottom: 10px;
  animation: tooltipFloat 3s ease-in-out infinite;
  transition: all 0.3s ease, transform 0.3s ease;

  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: var(--background-color);
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

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.1;
  }
  100% {
    transform: scale(1);
    opacity: 0.3;
  }
}

@keyframes slideInLeft {
  0% {
    transform: translateX(-100px) scale(0);
    opacity: 0;
  }
  100% {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}

@keyframes slideOutLeft {
  0% {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateX(-100px) scale(0);
    opacity: 0;
  }
}

@keyframes giftAppear {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes giftDisappear {
  0% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: scale(0) rotate(180deg);
    opacity: 0;
  }
}

@keyframes giftIconWiggle {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-5deg);
  }
  75% {
    transform: rotate(5deg);
  }
}

@keyframes giftClick {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.8);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes discountPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  }
}

@keyframes tooltipFloat {
  0%,
  100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-5px);
  }
}

@media (max-width: 768px) {
  .gift-icon {
    bottom: 20px;
    left: 20px;
  }

  .gift-icon__wrapper {
    width: 50px;
    height: 50px;
  }

  .gift-icon__svg {
    width: 24px;
    height: 24px;
  }

  .gift-icon__discount {
    font-size: 10px;
    padding: 3px 5px;
  }
}
</style>
