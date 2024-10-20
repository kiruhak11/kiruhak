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
  align-items: center;
  min-height: 100vh;
  background-color: #f0f4f8;
}

.about-content {
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  text-align: center;

  /* Анимация появления */
  opacity: 0;
  transform: scale(0.9);
  animation: fadeIn 0.7s ease forwards; /* Срабатывание анимации */
  animation-delay: 0.3s; /* Задержка перед началом анимации */
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
  color: #333;
}

.description {
  font-size: 1.2rem;
  color: #555;
  line-height: 1.6;
}
</style>
