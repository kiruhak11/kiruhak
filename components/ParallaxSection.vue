<template>
  <div
    class="tilt-section"
    @mousemove="handleMouseMove"
    @mouseleave="resetTilt"
  >
    <div class="tilt-content" :style="tiltStyle">
      <h2>Погрузись в мир Vue.js</h2>
      <p>Интерактивные эффекты, динамические данные и многое другое.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const tiltX = ref(0);
const tiltY = ref(0);

function handleMouseMove(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left; // положение по X внутри элемента
  const y = e.clientY - rect.top; // положение по Y внутри элемента
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  // Вычисляем смещение в градусах (до 10°)
  tiltX.value = ((y - centerY) / centerY) * 10; // вращение по X
  tiltY.value = ((x - centerX) / centerX) * 10; // вращение по Y
}

function resetTilt() {
  tiltX.value = 0;
  tiltY.value = 0;
}

const tiltStyle = computed(() => ({
  transform: `translate(-50%, -50%) rotateX(${tiltX.value}deg) rotateY(${tiltY.value}deg)`,
  transition: "transform 0.2s ease-out",
}));
</script>

<style scoped>
.tilt-section {
  position: relative;
  width: 100%;
  height: 400px;
  margin: 32px 0;
  perspective: 1200px; /* Немного увеличиваем глубину эффекта */
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Добавляем легкую анимацию фона */
  animation: backgroundPulse 10s ease-in-out infinite;
}

@keyframes backgroundPulse {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.1);
  }
}

.tilt-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-style: preserve-3d;
  padding: 48px 64px;
  background: linear-gradient(135deg, #007bff, #00d4ff);
  border-radius: 16px;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
  text-align: center;
}

.tilt-content:hover {
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
}

.tilt-content h2 {
  font-size: 2.8rem;
  margin-bottom: 16px;
  color: #333;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);
}

.tilt-content p {
  font-size: 1.3rem;
  color: #444;
  line-height: 1.5;
  margin: 0;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.08);
}
</style>
