<template>
  <div class="about-container">
    <div class="about-content" tabindex="0">
      <h1 class="title">
        <GradientText variant="primary">О нас</GradientText>
      </h1>
      <p class="description">
        {{
          time <= "12:00:00" && time >= "6:00:00"
            ? "Доброе утро!"
            : time <= "18:00:00" && time >= "12:00:00"
            ? "Добрый день!"
            : "Добрый вечер!"
        }}
        K-Studio — команда корпоративной веб‑разработки. Проектируем,
        разрабатываем и поддерживаем сайты и веб‑сервисы на
        <strong>Vue.js</strong> и <strong>Nuxt.js</strong>. Интеграции, SEO и
        внедрение CRM. Работаем под ключ.
      </p>

      <div class="skills-section">
        <h2>
          <GradientText variant="secondary">Реализуемые проекты</GradientText>
        </h2>
        <div class="skills-grid">
          <AnimatedSkillIcon name="Frontend" type="frontend">
            🎨
          </AnimatedSkillIcon>
          <AnimatedSkillIcon name="Backend" type="backend">
            ⚙️
          </AnimatedSkillIcon>
          <AnimatedSkillIcon name="Mobile" type="mobile">
            📱
          </AnimatedSkillIcon>
          <AnimatedSkillIcon name="DevOps" type="devops">
            🚀
          </AnimatedSkillIcon>
        </div>
      </div>

      <div class="cta-section">
        <h2>
          <GradientText variant="success">Готовы к внедрению</GradientText>
        </h2>
        <p>Соберём решение под задачи бизнеса: быстро, прозрачно, безопасно</p>
        <div class="cta-buttons">
          <button class="cta-button primary" @click="$emit('openOrderModal')">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Заказать сайт
          </button>
          <button
            class="cta-button secondary"
            @click="$emit('openDonationModal')"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                fill="currentColor"
              />
            </svg>
            Поддержать
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import GradientText from "./GradientText.vue";
import AnimatedSkillIcon from "./AnimatedSkillIcon.vue";
defineEmits(["openOrderModal", "openDonationModal"]);

const time = ref(new Date().toLocaleTimeString());
</script>

<style lang="scss" scoped>
.about-container {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 16px;
}

.about-content {
  background: var(--background-color);
  padding: 32px;
  border-radius: 20px;
  max-width: 700px;
  text-align: center;
  box-shadow: var(--card-shadow);
  opacity: 0;
  transform: scale(0.9);
  animation: fadeIn 0.7s ease forwards 0.3s;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  backdrop-filter: blur(10px);

  &:hover {
    box-shadow: var(--card-shadow-hover);
    transform: translateY(-2px);
  }
}

.about-content:focus {
  outline: none;
  box-shadow: var(--card-shadow-hover);
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
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 32px;
}

.skills-section {
  margin: 32px 0;

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 20px;
  }
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.cta-section {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid var(--border-color);

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 12px;
  }

  p {
    color: var(--color-text-secondary);
    margin-bottom: 24px;
    font-size: 1rem;
  }
}

.cta-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.cta-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;

  &.primary {
    background: var(--gradient-primary);
    color: white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }
  }

  &.secondary {
    background: var(--background-color);
    color: var(--color-text);
    border: 2px solid var(--border-color);

    &:hover {
      border-color: var(--error-color);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(239, 68, 68, 0.2);
    }
  }
}

@media (max-width: 768px) {
  .about-content {
    padding: 24px;
  }

  .title {
    font-size: 2.2rem;
  }

  .description {
    font-size: 1.1rem;
  }

  .skills-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }

  .cta-button {
    width: 100%;
    max-width: 250px;
    justify-content: center;
  }
}
</style>
