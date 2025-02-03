<template>
  <div class="about-container">
    <div class="about-content" tabindex="0">
      <h1 class="title">Обо мне</h1>
      <p class="description">
        Привет! Меня зовут <strong>Кирилл</strong>, я занимаюсь разработкой
        сайтов на Vue.js и Nuxt.js. Мне нравится создавать красивые и
        функциональные веб-приложения, которые приносят радость пользователям.
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.about-container {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 16px;
}
.about-content {
  background: var(--background-color-hover);
  padding: 32px;
  border-radius: 15px;
  max-width: 600px;
  text-align: center;
  box-shadow: 0 0px 16px var(--box-shadow-color);
  opacity: 0;
  transform: scale(0.9);
  animation: fadeIn 0.7s ease forwards 0.3s;
  transition: background-color 0.3s, box-shadow 0.3s;
}
.about-content:focus {
  outline: none;
  box-shadow: 0 0px 24px var(--box-shadow-color-hover);
}
@keyframes fadeIn {
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.title {
  font-size: 2.8rem;
  font-weight: bold;
  margin-bottom: 20px;
  color: var(--color-text);
}
.description {
  font-size: 1.3rem;
  color: var(--color-text);
  line-height: 1.6;
}
</style>
