<script setup lang="ts">
import { ref, onMounted } from "vue";

const emit = defineEmits(["spin-complete"]);
const isSpinning = ref(false);
const rotation = ref(0);
const discount = ref(0);
const canSpin = ref(true);
const timeLeft = ref("");

const discounts = [5, 10, 15, 20, 25, 30];
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
const STORAGE_KEY = "last_wheel_spin";

const formatTimeLeft = (ms: number) => {
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));

  if (days > 0) {
    return `${days}д ${hours}ч`;
  }
  if (hours > 0) {
    return `${hours}ч ${minutes}м`;
  }
  return `${minutes}м`;
};

const checkSpinAvailability = () => {
  const lastSpin = localStorage.getItem(STORAGE_KEY);
  if (!lastSpin) return true;

  const lastSpinTime = parseInt(lastSpin);
  const now = Date.now();
  const timePassed = now - lastSpinTime;

  if (timePassed < WEEK_IN_MS) {
    const timeRemaining = WEEK_IN_MS - timePassed;
    timeLeft.value = formatTimeLeft(timeRemaining);
    canSpin.value = false;
    return false;
  }

  canSpin.value = true;
  timeLeft.value = "";
  return true;
};

const updateTimer = () => {
  if (!canSpin.value) {
    checkSpinAvailability();
    setTimeout(updateTimer, 60000); // Обновляем каждую минуту
  }
};

onMounted(() => {
  checkSpinAvailability();
  updateTimer();
});

const spinWheel = () => {
  if (isSpinning.value || !canSpin.value) return;

  isSpinning.value = true;
  const randomSpins = 5 + Math.random() * 5;
  const randomSegment = Math.floor(Math.random() * discounts.length);
  const segmentAngle = 360 / discounts.length;
  const targetRotation = randomSpins * 360 + randomSegment * segmentAngle;

  rotation.value = targetRotation;
  discount.value = discounts[randomSegment];

  // Сохраняем время вращения
  localStorage.setItem(STORAGE_KEY, Date.now().toString());

  setTimeout(() => {
    isSpinning.value = false;
    canSpin.value = false;
    checkSpinAvailability();
    emit("spin-complete", discount.value);
  }, 5000);
};
</script>

<template>
  <div class="wheel-container">
    <div class="wheel-wrapper">
      <div class="wheel-border">
        <div
          class="wheel"
          :style="{ transform: `rotate(${rotation}deg)` }"
          :class="{ spinning: isSpinning }"
        >
          <div
            v-for="(disc, index) in discounts"
            :key="index"
            class="segment"
            :style="{
              transform: `rotate(${index * (360 / discounts.length)}deg)`,
              background:
                index % 2 === 0
                  ? 'var(--gradient-primary)'
                  : 'var(--gradient-secondary)',
            }"
          >
            <span class="discount-text">{{ disc }}%</span>
          </div>
          <div class="wheel-center"></div>
        </div>
      </div>
      <div class="pointer">
        <div class="pointer-head"></div>
      </div>
    </div>

    <div class="spin-controls">
      <button
        @click="spinWheel"
        :disabled="!canSpin || isSpinning"
        class="spin-button"
        :class="{ spinning: isSpinning }"
      >
        <template v-if="canSpin">
          {{ isSpinning ? "Крутится..." : "Испытать удачу" }}
        </template>
        <template v-else> Доступно через {{ timeLeft }} </template>
        <span class="button-shine"></span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.wheel-container {
  position: relative;
  width: 300px;
  height: 380px;
  margin: 2rem auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.wheel-wrapper {
  position: relative;
  width: 300px;
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.wheel-border {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--gradient-primary);
  padding: 3px;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.2);

  &::before {
    content: "";
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    border-radius: 50%;
    background: var(--gradient-primary);
    opacity: 0.1;
    z-index: -1;
  }
}

.wheel {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--background-color);
  transition: transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99);
  transform-origin: center;
  overflow: hidden;

  &.spinning {
    animation: glow 1s ease-in-out infinite alternate;
  }
}

.wheel-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  background: var(--gradient-primary);
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  z-index: 2;

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 15px;
    height: 15px;
    background: white;
    border-radius: 50%;
  }
}

.segment {
  position: absolute;
  width: 50%;
  height: 50%;
  transform-origin: 100% 100%;
  left: 0;
  top: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  clip-path: polygon(100% 100%, 0 100%, 100% 0);

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.2) 0%,
      rgba(255, 255, 255, 0) 100%
    );
  }

  .discount-text {
    position: absolute;
    left: 35%;
    top: 45%;
    transform: rotate(-60deg);
    font-weight: bold;
    font-size: 1.4rem;
    color: white;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    z-index: 1;
  }
}

.pointer {
  position: absolute;
  top: 50%;
  left: -30px;
  transform: translateY(-50%);
  z-index: 10;

  .pointer-head {
    width: 40px;
    height: 40px;
    background: var(--gradient-primary);
    clip-path: polygon(100% 50%, 0 0, 0 100%);
    filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.2));

    &::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-75%, -50%);
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
    }
  }
}

.spin-controls {
  text-align: center;
}

.spin-button {
  position: relative;
  padding: 15px 30px;
  min-width: 200px;
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  background: var(--gradient-primary);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    background: linear-gradient(45deg, #808080, #a0a0a0);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    opacity: 0.8;
  }

  &.spinning {
    animation: pulse 1.5s ease-in-out infinite;
  }

  .button-shine {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      120deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    animation: shine 3s infinite;
  }
}

@keyframes glow {
  from {
    box-shadow: 0 0 20px rgba(102, 126, 234, 0.5);
  }
  to {
    box-shadow: 0 0 30px rgba(102, 126, 234, 0.8);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.98);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes shine {
  0% {
    left: -100%;
  }
  20% {
    left: 100%;
  }
  100% {
    left: 100%;
  }
}

@media (max-width: 768px) {
  .wheel-container {
    width: 250px;
    height: 330px;
  }

  .wheel-wrapper {
    width: 250px;
    height: 250px;
  }

  .segment .discount-text {
    font-size: 1.2rem;
    left: 30%;
  }

  .pointer .pointer-head {
    width: 30px;
    height: 30px;
  }

  .wheel-center {
    width: 25px;
    height: 25px;

    &::after {
      width: 12px;
      height: 12px;
    }
  }
}
</style>
