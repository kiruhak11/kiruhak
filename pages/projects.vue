<template>
  <NuxtLayout>
    <main>
      <div class="container">
        <div class="label">
          <h1>Проекты</h1>
        </div>
        <div class="cards">
          <ProjectCard
            title="AirPods Store"
            url="https://airpodsstore.kiruhak11.ru"
            startDate="01.09.2024"
            :isOnline="false"
          >
            <template #icon>
              <IconAirPods />
            </template>
          </ProjectCard>

          <ProjectCard
            title="Mixer timetable"
            url="https://mixers-adalin.ru"
            startDate="01.01.2025"
            :isOnline="true"
          >
            <template #icon>
              <IconMixer />
            </template>
          </ProjectCard>

          <ProjectCard
            title="DevHorizon"
            url="https://devhorizon.kiruhak11.ru"
            startDate="01.10.2024"
            :isOnline="false"
          >
            <template #icon>
              <IconBook />
            </template>
          </ProjectCard>
        </div>
      </div>
    </main>
  </NuxtLayout>
</template>

<script setup>
// Логика на уровне страницы не требуется – все эффекты реализованы внутри ProjectCard.
</script>

<style lang="scss" scoped>
.container {
  padding: 0 32px;
}

.label {
  display: flex;
  justify-content: center;
  padding: 16px;
}

h1 {
  display: flex;
  justify-content: center;
  padding: 32px;
  color: var(--color-text);
  transform: scale(0.9);
  animation: fadeIn 0.7s ease forwards;
  animation-delay: 0.3s;
}

@keyframes fadeIn {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.cards {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 64px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 32px;
  }
}
</style>
