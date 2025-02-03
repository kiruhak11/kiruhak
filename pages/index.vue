<template>
  <NuxtLayout>
    <div class="main-container">
      <!-- Эффект печатающей машинки с приветственным сообщением -->
      <Typewriter text="Добро пожаловать на мой сайт!" />

      <!-- Блок "Обо мне" -->
      <AboutMe />

      <!-- Проверка фокуса окна браузера -->
      <FocusChecker />

      <!-- Секция с параллакс эффектом -->
      <ParallaxSection />

      <client-only>
        <PhysicalBox />
      </client-only>

      <!-- Интерактивная галерея -->
      <InteractiveGallery />
    </div>
  </NuxtLayout>
</template>

<script setup>
import AboutMe from "~/components/AboutMe.vue";
import FocusChecker from "~/components/FocusChecker.vue";
import PhysicalBox from "~/components/PhysicalBox.vue";
import Typewriter from "~/components/Typewriter.vue";
import ParallaxSection from "~/components/ParallaxSection.vue";
import InteractiveGallery from "~/components/InteractiveGallery.vue";
</script>

<style lang="scss" scoped>
.main-container {
  position: relative;
  overflow: hidden;
  background-color: var(--background-color);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 64px;
  padding: 32px;
}
</style>
