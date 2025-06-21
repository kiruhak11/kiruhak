<template>
  <div class="floating-cards">
    <div 
      v-for="(card, index) in cards" 
      :key="index"
      class="floating-card"
      :style="card.style"
    >
      <div class="card-content">
        <div class="card-icon">{{ card.icon }}</div>
        <div class="card-text">{{ card.text }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const cards = ref([
  { icon: '⚡', text: 'Быстро', style: {} },
  { icon: '🎨', text: 'Красиво', style: {} },
  { icon: '🚀', text: 'Современно', style: {} },
  { icon: '💡', text: 'Инновационно', style: {} },
  { icon: '🔧', text: 'Надежно', style: {} },
  { icon: '📱', text: 'Адаптивно', style: {} }
])

onMounted(() => {
  // Анимация плавания карточек
  cards.value.forEach((card, index) => {
    const delay = index * 0.5
    const duration = 3 + Math.random() * 2
    
    card.style = {
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`
    }
  })
})
</script>

<style lang="scss" scoped>
.floating-cards {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}

.floating-card {
  position: absolute;
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 16px;
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(10px);
  animation: float 4s ease-in-out infinite;
  opacity: 0.7;
  transition: all 0.3s ease;
  
  &:hover {
    opacity: 1;
    transform: scale(1.05);
  }
  
  &:nth-child(1) {
    top: 10%;
    left: 10%;
    animation-delay: 0s;
  }
  
  &:nth-child(2) {
    top: 20%;
    right: 15%;
    animation-delay: 0.5s;
  }
  
  &:nth-child(3) {
    top: 60%;
    left: 5%;
    animation-delay: 1s;
  }
  
  &:nth-child(4) {
    top: 70%;
    right: 10%;
    animation-delay: 1.5s;
  }
  
  &:nth-child(5) {
    top: 40%;
    left: 50%;
    animation-delay: 2s;
  }
  
  &:nth-child(6) {
    top: 80%;
    left: 30%;
    animation-delay: 2.5s;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  25% {
    transform: translateY(-20px) rotate(2deg);
  }
  50% {
    transform: translateY(-10px) rotate(-1deg);
  }
  75% {
    transform: translateY(-15px) rotate(1deg);
  }
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.card-icon {
  font-size: 24px;
}

.card-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-align: center;
}

@media (max-width: 768px) {
  .floating-card {
    padding: 12px;
    
    &:nth-child(1) { top: 5%; left: 5%; }
    &:nth-child(2) { top: 15%; right: 5%; }
    &:nth-child(3) { top: 50%; left: 2%; }
    &:nth-child(4) { top: 65%; right: 5%; }
    &:nth-child(5) { top: 35%; left: 40%; }
    &:nth-child(6) { top: 75%; left: 20%; }
  }
  
  .card-icon {
    font-size: 20px;
  }
  
  .card-text {
    font-size: 10px;
  }
}
</style> 