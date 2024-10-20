<template>
  <div class="about-container">
    <div class="about-content">
      <h1 class="title">Обо мне</h1>
      <p class="description">
        Привет! Меня зовут <strong>Кирилл</strong>, я занимаюсь разработкой
        сайтов на Vue.js и Nuxt.js. Мне нравится создавать красивые и
        функциональные веб-приложения, которые приносят радость пользователям.
      </p>
    </div>
  </div>
</template>

<style scoped>
.about-container {
  display: flex;
  justify-content: center;
  margin-top: 128px;
  padding: 0 8px;
  background-color: var(--background-color);
}

.about-content {
  background: var(--background-color-hover);
  padding: 24px;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  text-align: center;

  opacity: 0;
  transform: scale(0.9);
  animation: fadeIn 0.7s ease forwards;
  animation-delay: 0.3s;
  box-shadow: 0 0px 16px var(--box-shadow-color);
  transition: background-color 0.3s, box-shadow 0.3s;
  &:hover {
    background-color: var(--background-color-hover);
    box-shadow: 0 0px 24px var(--box-shadow-color-hover);
  }
}

@keyframes fadeIn {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.title {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 20px;
  color: var(--color-text);
}

.description {
  font-size: 1.2rem;
  color: var(--color-text);
  line-height: 1.6;
}
</style>
