<template>
  <div class="physical-box">
    <!-- Выводим текущий счёт -->
    <div class="score">Очки: {{ score }}</div>
    <!-- Дыра, в которую нужно бросать кубики -->
    <div
      class="hole"
      :style="{ left: hole.x + 'px', top: hole.y + 'px' }"
    ></div>
    <!-- Кубики, которые можно перетаскивать -->
    <div
      class="object"
      v-for="(item, index) in objects"
      :key="index"
      :style="{
        left: item.x + 'px',
        top: item.y + 'px',
        backgroundColor: item.color,
      }"
      @mousedown="startDrag($event, index)"
    ></div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";

// Размеры контейнера и объектов
const boxWidth = 600;
const boxHeight = 400;
const cubeSize = 50;
const holeSize = 80;

// Счёт игры
const score = ref(0);

// Массив кубиков
const objects = reactive([{ x: 50, y: 50, color: "#ff6b6b" }]);

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
</script>

<style lang="scss" scoped>
.physical-box {
  position: relative;
  width: 600px;
  height: 400px;
  background-color: var(--background-color-hover);
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  margin: 0 auto;
}

/* Счёт отображается в левом верхнем углу */
.score {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--color-text);
}

/* Дыра — цель для кубиков */
.hole {
  position: absolute;
  width: 80px;
  height: 80px;
  border: 3px solid var(--color-accent);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--box-shadow-color);
  z-index: 5;
}

/* Кубики */
.object {
  position: absolute;
  width: 50px;
  height: 50px;
  border-radius: 8px;
  cursor: grab;
  transition: transform 0.2s;
  z-index: 6;
}

.object:active {
  cursor: grabbing;
  transform: scale(1.1);
}
</style>
