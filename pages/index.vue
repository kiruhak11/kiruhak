<template>
  <NuxtLayout>
    <main>
      <div class="container">
        <div class="hero-section">
          <Typewriter text="Привет, я Кирилл!" :speed="100" :delay="500" />
          <p class="hero-subtitle">
            Front-end разработчик, создающий современные и красивые веб-приложения
          </p>
          <div class="hero-buttons">
            <button class="hero-button primary" @click="setModal(OrderModal)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Заказать сайт
            </button>
            <button class="hero-button secondary" @click="setModal(DonationModal)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor"/>
              </svg>
              Поддержать проект
            </button>
          </div>
        </div>

        <AboutMe @openOrderModal="
setModal(OrderModal)" @openDonationModal="setModal( DonationModal)" />
        
        <StatsSection />
        
        <FloatingCards />
      </div>

    </main>
  </NuxtLayout>
</template>

<script setup>
import { ref } from 'vue'
import Typewriter from '~/components/Typewriter.vue'
import AboutMe from '~/components/AboutMe.vue'
import StatsSection from '~/components/StatsSection.vue'
import FloatingCards from '~/components/FloatingCards.vue'
import OrderModal from '~/components/OrderModal.vue'
import DonationModal from '~/components/DonationModal.vue'

const { setModal } = useFrogModal()

// Состояние модальных окон
const isDonationModalOpen = ref(false)
const isOrderModalOpen = ref(false)

const openDonationModal = () => {
  isDonationModalOpen.value = true
}

const closeDonationModal = () => {
  isDonationModalOpen.value = false
}

const openOrderModal = () => {
  isOrderModalOpen.value = true
}

const closeOrderModal = () => {
  isOrderModalOpen.value = false
}
</script>

<style lang="scss" scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
}

.hero-section {
  text-align: center;
  padding: 80px 0 60px;
  
  .hero-subtitle {
    font-size: 1.3rem;
    color: var(--color-text-secondary);
    margin: 24px 0 40px 0;
    line-height: 1.6;
    animation: fadeInUp 0.8s ease forwards 0.6s;
    opacity: 0;
  }
}

.hero-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
  animation: fadeInUp 0.8s ease forwards 0.8s;
  opacity: 0;
}

.hero-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 28px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  
  &.primary {
    background: var(--gradient-primary);
    color: white;
    
    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }
  }
  
  &.secondary {
    background: var(--background-color);
    color: var(--color-text);
    border: 2px solid var(--border-color);
    
    &:hover {
      border-color: #ef4444;
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(239, 68, 68, 0.2);
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
  
  .hero-section {
    padding: 60px 0 40px;
    
    .hero-subtitle {
      font-size: 1.1rem;
      margin: 20px 0 30px 0;
    }
  }
  
  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .hero-button {
    width: 100%;
    max-width: 300px;
    justify-content: center;
  }
}
</style>
