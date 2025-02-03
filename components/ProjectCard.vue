<template>
  <div
    class="card-container"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <!-- Задний фон с информацией о проекте -->
    <div class="back-face">
      <div class="info">
        <h3>{{ title }}</h3>
        <p><strong>Дата старта:</strong> {{ startDate }}</p>
        <p :class="statusClass"><strong>Статус:</strong> {{ statusText }}</p>
      </div>
    </div>
    <!-- Передняя сторона (видимый контент) -->
    <div class="card">
      <NuxtLink :to="url" class="content">
        <slot name="icon" />
        <div class="title">{{ title }}</div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

const props = defineProps({
  title: String,
  url: String,
  startDate: String,
  isOnline: Boolean,
});

const hovered = ref(false);
const onlineStatus = ref(props.isOnline); // начальное значение из пропсов

// Функция проверки работоспособности сайта
async function checkStatus() {
  try {
    // Пытаемся выполнить HEAD-запрос к сайту.
    // Внимание: из-за ограничений CORS данный запрос может вернуть opaque-ответ.
    await fetch(props.url, { method: "HEAD", mode: "no-cors" });
    onlineStatus.value = true;
  } catch (error) {
    onlineStatus.value = false;
  }
}

onMounted(() => {
  checkStatus();
  // Обновляем статус каждые 30 секунд
  setInterval(checkStatus, 30000);
});

const statusText = computed(() => {
  if (onlineStatus.value === null) return "Проверка...";
  return onlineStatus.value ? "Работает" : "Не работает";
});

const statusClass = computed(() =>
  onlineStatus.value ? "status-working" : "status-not-working"
);
</script>

<style lang="scss" scoped>
.title {
  margin-top: 8px;
  text-align: center;
  font-size: 16px;
  font-weight: bold;
  color: var(--color-text);
}

.card-container {
  position: relative;
  width: 200px;
  height: 250px;
  overflow: hidden;
  cursor: pointer;
  perspective: 1000px;
}

/* Задний фон, на котором располагается информация о сайте */
.back-face {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--background-info-color, #f0f0f0);
  display: flex;
  color: var(--background-color);
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-radius: 5px;
  box-shadow: 0 0 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  transform: translateX(100%);
  z-index: 1;
}

/* Передняя сторона карточки с контентом */
.card {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--background-color, #fff);
  border-radius: 12px;
  border: 1px solid var(--background-info-color);
  box-shadow: 0 0 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Стилизация содержимого передней стороны */
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: inherit;
}

/* При наведении карточка сдвигается влево */
.card-container:hover .card {
  transform: translateX(-250px);
}

/* При наведении задний фон выезжает (сквозь прозрачное место, оставшееся после сдвига) */
.card-container:hover .back-face {
  transform: translateX(0);
}

/* Стилизация информации на заднем фоне */
.info {
  text-align: center;
}

.info h3 {
  margin: 0 0 8px;
  font-size: 1.2rem;
}

.info p {
  margin: 4px 0;
  font-size: 0.9rem;
}

.status-working {
  color: #2bff00;
  font-weight: bold;
}

.status-not-working {
  color: #ff0000;
  font-weight: bold;
}
</style>
