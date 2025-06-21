<template>
  <div class="physical-box-container">
    <div class="game-header">
      <h2>
        <GradientText variant="primary">Мини-игра</GradientText>
      </h2>
      <p>Перетащите кубик в цель для получения очков</p>
    </div>
    
    <div class="physical-box">
      <div class="score-display">
        <div class="score-item">
          <span class="score-label">Очки</span>
          <span class="score-value">{{ score }}</span>
        </div>
        <div class="score-item">
          <span class="score-label">Попытки</span>
          <span class="score-value">{{ attempts }}</span>
        </div>
      </div>
      
      <div
        class="hole"
        :style="{ left: hole.x + 'px', top: hole.y + 'px' }"
      >
        <div class="hole-glow"></div>
      </div>
      
      <div
        class="cube"
        v-for="(item, index) in objects"
        :key="index"
        :style="{
          left: item.x + 'px',
          top: item.y + 'px',
          backgroundColor: item.color,
        }"
        @mousedown="startDrag($event, index)"
      >
        <div class="cube-face cube-front"></div>
        <div class="cube-face cube-back"></div>
        <div class="cube-face cube-right"></div>
        <div class="cube-face cube-left"></div>
        <div class="cube-face cube-top"></div>
        <div class="cube-face cube-bottom"></div>
      </div>
    </div>
    
    <div class="game-controls">
      <button class="control-button" @click="resetGame">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12Z" stroke="currentColor" stroke-width="2"/>
          <path d="M12 7V12L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Новая игра
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import GradientText from './GradientText.vue';

// Размеры контейнера и объектов
const boxWidth = 600;
const boxHeight = 400;
const cubeSize = 50;
const holeSize = 80;

// Счёт игры
const score = ref(0);
const attempts = ref(0);

// Массив кубиков
const objects = reactive([{ x: 50, y: 50, color: "#667eea" }]);

// Дыра — случайное положение в пределах коробки
// Изначально задаем положение дыры по центру
const hole = reactive({
  x: (boxWidth - holeSize) / 2,
  y: (boxHeight - holeSize) / 2,
});

function randomHoleX() {
  return Math.floor(Math.random() * (boxWidth - holeSize));
}
function randomHoleY() {
  return Math.floor(Math.random() * (boxHeight - holeSize));
}

// Переменные для перетаскивания
const draggingIndex = ref(null);
const offset = reactive({ x: 0, y: 0 });

function startDrag(e, index) {
  draggingIndex.value = index;
  offset.x = e.clientX - objects[index].x;
  offset.y = e.clientY - objects[index].y;
  window.addEventListener("mousemove", onDrag);
  window.addEventListener("mouseup", stopDrag);
}

function onDrag(e) {
  if (draggingIndex.value !== null) {
    const obj = objects[draggingIndex.value];
    obj.x = e.clientX - offset.x;
    obj.y = e.clientY - offset.y;
    // Ограничиваем перемещение в пределах коробки
    obj.x = Math.max(0, Math.min(obj.x, boxWidth - cubeSize));
    obj.y = Math.max(0, Math.min(obj.y, boxHeight - cubeSize));
  }
}

function stopDrag() {
  if (draggingIndex.value !== null) {
    attempts.value++;
    const obj = objects[draggingIndex.value];
    // Вычисляем центр кубика
    const centerX = obj.x + cubeSize / 2;
    const centerY = obj.y + cubeSize / 2;
    // Если центр кубика внутри дыры, начисляем очки
    if (
      centerX >= hole.x &&
      centerX <= hole.x + holeSize &&
      centerY >= hole.y &&
      centerY <= hole.y + holeSize
    ) {
      score.value++;
      // Перемещаем дыру в случайное место
      hole.x = randomHoleX();
      hole.y = randomHoleY();
      // Перемещаем кубик в случайное место внутри коробки
      obj.x = Math.floor(Math.random() * (boxWidth - cubeSize));
      obj.y = Math.floor(Math.random() * (boxHeight - cubeSize));
    }
  }
  draggingIndex.value = null;
  window.removeEventListener("mousemove", onDrag);
  window.removeEventListener("mouseup", stopDrag);
}

function resetGame() {
  score.value = 0;
  attempts.value = 0;
  hole.x = (boxWidth - holeSize) / 2;
  hole.y = (boxHeight - holeSize) / 2;
  objects[0].x = 50;
  objects[0].y = 50;
}
</script>

<style lang="scss" scoped>
.physical-box-container {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 32px;
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(10px);
  animation: slideInUp 0.8s ease-out;
}

.game-header {
  text-align: center;
  margin-bottom: 24px;
  
  h2 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 8px;
  }
  
  p {
    color: var(--color-text-secondary);
    font-size: 1.1rem;
  }
}

.physical-box {
  position: relative;
  width: 600px;
  height: 400px;
  background: var(--background-color-secondary);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
  margin: 0 auto 24px auto;
  box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.1);
}

.score-display {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  display: flex;
  gap: 16px;
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--card-shadow);
}

.score-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.score-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-accent);
}

.hole {
  position: absolute;
  width: 80px;
  height: 80px;
  border: 3px solid var(--success-color);
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
  z-index: 5;
  animation: holePulse 2s ease-in-out infinite;
}

.hole-glow {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border: 2px solid rgba(34, 197, 94, 0.2);
  border-radius: 50%;
  animation: glowPulse 2s ease-in-out infinite;
}

@keyframes holePulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes glowPulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

.cube {
  position: absolute;
  width: 50px;
  height: 50px;
  cursor: grab;
  transition: transform 0.2s;
  z-index: 6;
  transform-style: preserve-3d;
  
  &:active {
    cursor: grabbing;
    transform: scale(1.1) rotateY(45deg);
  }
}

.cube-face {
  position: absolute;
  width: 50px;
  height: 50px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
}

.cube-front { transform: translateZ(25px); }
.cube-back { transform: translateZ(-25px) rotateY(180deg); }
.cube-right { transform: translateX(25px) rotateY(90deg); }
.cube-left { transform: translateX(-25px) rotateY(-90deg); }
.cube-top { transform: translateY(-25px) rotateX(90deg); }
.cube-bottom { transform: translateY(25px) rotateX(-90deg); }

.game-controls {
  display: flex;
  justify-content: center;
}

.control-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .physical-box-container {
    padding: 24px;
  }
  
  .game-header h2 {
    font-size: 1.5rem;
  }
  
  .physical-box {
    width: 100%;
    max-width: 400px;
    height: 300px;
  }
  
  .score-display {
    top: 8px;
    left: 8px;
    gap: 8px;
  }
  
  .score-item {
    padding: 6px 12px;
  }
  
  .score-value {
    font-size: 1.2rem;
  }
  
  .hole {
    width: 60px;
    height: 60px;
  }
  
  .cube {
    width: 40px;
    height: 40px;
  }
  
  .cube-face {
    width: 40px;
    height: 40px;
  }
}
</style>
