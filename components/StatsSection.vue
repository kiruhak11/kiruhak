<template>
  <div class="stats-container">
    <div class="stats-content">
      <h2>
        <GradientText variant="primary">Наши достижения</GradientText>
      </h2>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-number">
            <AnimatedCounter :value="targetStats.projects" :delay="0" />
          </div>
          <div class="stat-label">Проектов</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">
            <AnimatedCounter :value="targetStats.experience" :delay="500" />+
          </div>
          <div class="stat-label">Лет опыта</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">
            <AnimatedCounter :value="targetStats.clients" :delay="1000" />
          </div>
          <div class="stat-label">Довольных клиентов</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">
            <AnimatedCounter :value="targetStats.technologies" :delay="1500" />
          </div>
          <div class="stat-label">Технологий</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import GradientText from "./GradientText.vue";
import AnimatedCounter from "./AnimatedCounter.vue";

// Липовая корпоративная статистика для вау‑эффекта
const targetStats = {
  projects: 48,
  experience: 5,
  clients: 37,
  technologies: 18,
};
</script>

<style lang="scss" scoped>
.stats-container {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  align-items: center;
  justify-content: center;
  gap: 24px;
  width: 100%;
  padding: 16px;
}

.stats-content {
  background: var(--background-color);
  padding: 32px;
  border-radius: 20px;
  max-width: 800px;
  text-align: center;
  box-shadow: var(--card-shadow);
  opacity: 0;
  transform: scale(0.9);
  animation: fadeIn 0.7s ease forwards 0.5s;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  backdrop-filter: blur(10px);

  &:hover {
    box-shadow: var(--card-shadow-hover);
    transform: translateY(-2px);
  }
}

@keyframes fadeIn {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

h2 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
  background: var(--background-color-secondary);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--card-shadow-hover);
    border-color: var(--color-accent);
  }
}

.stat-number {
  color: var(--color-text);
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

@media (max-width: 768px) {
  .stats-content {
    padding: 24px;
  }

  h2 {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .stat-item {
    padding: 16px;
  }

  .stat-number {
    font-size: 2rem;
  }

  .stat-label {
    font-size: 0.8rem;
  }
}
</style>
