<template>
  <NuxtLayout>
    <main class="contact-page">
      
      <div class="container">
        <div class="header-section">
          <h1 class="main-title">
            <GradientText variant="primary">Мои контакты</GradientText>
          </h1>
          <p class="subtitle">Свяжитесь со мной любым удобным способом</p>
        </div>

        <div class="contact-grid">
          <!-- Основные контакты -->
          <div class="contact-section">
            <h2>
              <GradientText variant="secondary">Социальные сети</GradientText>
            </h2>
            <div class="social-links">
              <a href="https://github.com/kiruhak11" class="social-card github" target="_blank">
                <div class="card-icon">
                  <IconGitHub />
                </div>
                <div class="card-content">
                  <h3>GitHub</h3>
                  <p>Мои проекты и код</p>
                  <span class="username">@kiruhak11</span>
                </div>
                <div class="card-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 17L17 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7 7H17V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </a>

              <a href="https://t.me/kiruhak11" class="social-card telegram" target="_blank">
                <div class="card-icon">
                  <IconTg />
                </div>
                <div class="card-content">
                  <h3>Telegram</h3>
                  <p>Быстрая связь</p>
                  <span class="username">@kiruhak11</span>
                </div>
                <div class="card-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 17L17 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7 7H17V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </a>

              <a href="https://vk.com/kiruhak11" class="social-card vk" target="_blank">
                <div class="card-icon">
                  <IconVk />
                </div>
                <div class="card-content">
                  <h3>VKontakte</h3>
                  <p>Социальная сеть</p>
                  <span class="username">@kiruhak11</span>
                </div>
                <div class="card-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 17L17 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7 7H17V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </a>
            </div>
          </div>

          <!-- Информация о работе -->
          <div class="contact-section">
            <h2>
              <GradientText variant="success">Работа и проекты</GradientText>
            </h2>
            <div class="info-cards">
              <div class="info-card">
                <div class="info-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="info-content">
                  <h3>Разработка сайтов</h3>
                  <p>Создание современных веб-приложений на Vue.js и Nuxt.js</p>
                </div>
              </div>

              <div class="info-card">
                <div class="info-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="info-content">
                  <h3>Быстрые сроки</h3>
                  <p>Эффективная разработка с соблюдением дедлайнов</p>
                </div>
              </div>

              <div class="info-card">
                <div class="info-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2"/>
                  </svg>
                </div>
                <div class="info-content">
                  <h3>Качество</h3>
                  <p>Современные технологии и лучшие практики разработки</p>
                </div>
              </div>
            </div>
          </div>

          <!-- CTA секция -->
          <div class="cta-section">
            <h2>
              <GradientText variant="warning">Готов к новым проектам!</GradientText>
            </h2>
            <p>Давайте создадим что-то удивительное вместе</p>
            <div class="cta-buttons">
              <button class="cta-button primary" @click="setModal(OrderModal)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Заказать сайт
              </button>
              <button class="cta-button secondary" @click="setModal(DonationModal)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor"/>
                </svg>
                Поддержать проект
              </button>
            </div>
          </div>
        </div>
      </div>


    </main>
  </NuxtLayout>
</template>

<script setup lang="ts">
import GradientText from '~/components/GradientText.vue'
import DonationModal from '~/components/DonationModal.vue'
import OrderModal from '~/components/OrderModal.vue'

const { setModal } = useFrogModal()





</script>

<style lang="scss" scoped>
.contact-page {
  min-height: 100vh;
  background: var(--background-color);
  padding: 32px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
}

.header-section {
  text-align: center;
  margin-bottom: 64px;
  
  .main-title {
    font-size: 3rem;
    font-weight: 700;
    margin: 0 0 16px 0;
    animation: fadeInUp 0.8s ease forwards;
  }
  
  .subtitle {
    font-size: 1.2rem;
    color: var(--color-text-secondary);
    margin: 0;
    animation: fadeInUp 0.8s ease forwards 0.2s;
    opacity: 0;
  }
}

.contact-grid {
  display: grid;
  gap: 48px;
}

.contact-section {
  h2 {
    font-size: 1.8rem;
    font-weight: 600;
    margin: 0 0 32px 0;
    text-align: center;
  }
}

.social-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.social-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  text-decoration: none;
  color: var(--color-text);
  transition: all 0.3s ease;
  box-shadow: var(--card-shadow);
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: var(--card-shadow-hover);
    border-color: var(--color-accent);
    
    .card-arrow {
      transform: translateX(4px);
    }
  }
  
  &.github:hover {
    border-color: #333;
    .card-icon { color: #333; }
  }
  
  &.telegram:hover {
    border-color: #0088cc;
    .card-icon { color: #0088cc; }
  }
  
  &.vk:hover {
    border-color: #4a76a8;
    .card-icon { color: #4a76a8; }
  }
}

.card-icon {
  font-size: 2.5rem;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  
  h3 {
    font-size: 1.2rem;
    font-weight: 600;
    margin: 0 0 4px 0;
  }
  
  p {
    color: var(--color-text-secondary);
    margin: 0 0 8px 0;
    font-size: 0.9rem;
  }
  
  .username {
    color: var(--color-accent);
    font-weight: 600;
    font-size: 0.9rem;
  }
}

.card-arrow {
  transition: transform 0.3s ease;
  color: var(--color-text-secondary);
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.info-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  transition: all 0.3s ease;
  box-shadow: var(--card-shadow);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--card-shadow-hover);
    border-color: var(--color-accent);
  }
}

.info-icon {
  color: var(--color-accent);
  flex-shrink: 0;
  margin-top: 4px;
}

.info-content {
  h3 {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 8px 0;
  }
  
  p {
    color: var(--color-text-secondary);
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.5;
  }
}

.cta-section {
  text-align: center;
  padding: 48px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 20px;
  border: 1px solid var(--background-info-color);
  
  h2 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 16px 0;
  }
  
  p {
    font-size: 1.1rem;
    color: var(--color-text-secondary);
    margin: 0 0 32px 0;
    line-height: 1.6;
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
  padding: 16px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
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
    border: 2px solid var(--background-info-color);
    
    &:hover {
      border-color: #ef4444;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(239, 68, 68, 0.2);
    }
  }
}

@keyframes fadeInUp {
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
  .container {
    padding: 0 16px;
  }
  
  .header-section {
    margin-bottom: 48px;
    
    .main-title {
      font-size: 2.2rem;
    }
    
    .subtitle {
      font-size: 1rem;
    }
  }
  
  .social-links {
    grid-template-columns: 1fr;
  }
  
  .info-cards {
    grid-template-columns: 1fr;
  }
  
  .cta-section {
    padding: 32px 24px;
  }
  
  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .cta-button {
    width: 100%;
    max-width: 300px;
    justify-content: center;
  }
}
</style>
