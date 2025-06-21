<template>
  <div class="parallax-section">
    <!-- Animated background elements -->
    <div class="bg-elements">
      <div class="bg-circle circle-1"></div>
      <div class="bg-circle circle-2"></div>
      <div class="bg-circle circle-3"></div>
      <div class="bg-line line-1"></div>
      <div class="bg-line line-2"></div>
    </div>
    
    <div class="parallax-container" @mousemove="handleMouseMove" @mouseleave="resetTilt">
      <div class="parallax-content" :style="tiltStyle">
        <div class="content-header">
          <div class="header-badge">
            <span>✨ Интерактивность</span>
          </div>
          <h2>
            <GradientText variant="primary">Погрузись в мир</GradientText>
            <br>
            <span class="tech-text">Vue.js & Nuxt.js</span>
          </h2>
          <p>Создаю современные веб-приложения с интерактивными эффектами, динамическими данными и передовыми технологиями</p>
        </div>
        
        <div class="content-features">
          <div class="feature-item" v-for="(feature, index) in features" :key="index">
            <div class="feature-icon">
              <span>{{ feature.icon }}</span>
              <div class="icon-glow"></div>
            </div>
            <div class="feature-content">
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </div>
          </div>
        </div>
        
        <div class="content-stats">
          <div class="stat-item">
            <div class="stat-number">100%</div>
            <div class="stat-label">Адаптивность</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">50+</div>
            <div class="stat-label">Компонентов</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">24/7</div>
            <div class="stat-label">Поддержка</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import GradientText from './GradientText.vue';

const tiltX = ref(0);
const tiltY = ref(0);

const features = ref([
  {
    icon: "⚡",
    title: "Быстрая разработка",
    description: "Использую современные инструменты для ускорения процесса"
  },
  {
    icon: "🎨",
    title: "Красивый дизайн",
    description: "Создаю уникальные и привлекательные интерфейсы"
  },
  {
    icon: "🚀",
    title: "Современные технологии",
    description: "Применяю последние достижения веб-разработки"
  }
]);

function handleMouseMove(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  tiltX.value = ((y - centerY) / centerY) * 4;
  tiltY.value = ((x - centerX) / centerX) * 4;
}

function resetTilt() {
  tiltX.value = 0;
  tiltY.value = 0;
}

const tiltStyle = computed(() => ({
  transform: `rotateX(${tiltX.value}deg) rotateY(${tiltY.value}deg)`,
  transition: "transform 0.3s ease-out",
}));
</script>

<style lang="scss" scoped>
.parallax-section {
  position: relative;
  height: 100%;
  margin: 60px 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, 
    rgba(102, 126, 234, 0.03) 0%, 
    rgba(118, 75, 162, 0.03) 50%,
    rgba(240, 113, 154, 0.03) 100%
  );
  border-radius: 24px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  padding: 40px 0;
}

.bg-elements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  animation: float 6s ease-in-out infinite;
  z-index: 1;
  
  &.circle-1 {
    width: 120px;
    height: 120px;
    top: 5%;
    left: 5%;
    animation-delay: 0s;
  }
  
  &.circle-2 {
    width: 80px;
    height: 80px;
    top: 70%;
    right: 10%;
    animation-delay: 2s;
  }
  
  &.circle-3 {
    width: 60px;
    height: 60px;
    bottom: 10%;
    left: 15%;
    animation-delay: 4s;
  }
}

.bg-line {
  position: absolute;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
  height: 2px;
  animation: slide 8s linear infinite;
  z-index: 1;
  
  &.line-1 {
    width: 200px;
    top: 20%;
    left: -200px;
    animation-delay: 1s;
  }
  
  &.line-2 {
    width: 150px;
    bottom: 30%;
    right: -150px;
    animation-delay: 3s;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

@keyframes slide {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(calc(100vw + 200px));
  }
}

.parallax-container {
  position: relative;
  width: 100%;
  height: 100%;
  perspective: 1500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.parallax-content {
  position: relative;
  transform-style: preserve-3d;
  padding: 48px 64px;
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
  text-align: center;
  backdrop-filter: blur(20px);
  animation: slideInUp 0.8s ease-out;
  max-width: 800px;
  width: 90%;
  z-index: 10;
  
  &:hover {
    box-shadow: 
      0 30px 60px rgba(102, 126, 234, 0.15),
      0 0 0 1px rgba(102, 126, 234, 0.2);
  }
}

.content-header {
  margin-bottom: 40px;
}

.header-badge {
  display: inline-block;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 20px;
  padding: 8px 16px;
  margin-bottom: 20px;
  
  span {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-accent);
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.content-header h2 {
  font-size: 2.8rem;
  font-weight: 800;
  margin-bottom: 16px;
  color: var(--color-text);
  line-height: 1.2;
}

.tech-text {
  background: var(--gradient-secondary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 800;
}

.content-header p {
  font-size: 1.2rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
}

.content-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  background: var(--background-color-secondary);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 32px rgba(102, 126, 234, 0.15);
    border-color: var(--color-accent);
    
    &::before {
      left: 100%;
    }
    
    .feature-icon {
      transform: scale(1.1) rotate(5deg);
    }
  }
}

.feature-icon {
  position: relative;
  font-size: 2.5rem;
  transition: all 0.3s ease;
  
  .icon-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    background: radial-gradient(circle, rgba(102, 126, 234, 0.2), transparent);
    border-radius: 50%;
    z-index: -1;
  }
}

.feature-content {
  text-align: center;
  
  h3 {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 8px;
  }
  
  p {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: 0;
  }
}

.content-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding-top: 32px;
  border-top: 1px solid var(--border-color);
}

.stat-item {
  text-align: center;
  
  .stat-number {
    font-size: 2rem;
    font-weight: 800;
    color: var(--color-accent);
    margin-bottom: 4px;
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .stat-label {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
    font-weight: 600;
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .parallax-section {
    height: auto;
    min-height: 500px;
    margin: 40px 0;
    padding: 20px 0;
  }
  
  .parallax-container {
    perspective: none;
  }
  
  .parallax-content {
    padding: 32px 24px;
    transform: none !important;
    width: 100%;
  }
  
  .content-header h2 {
    font-size: 2rem;
  }
  
  .content-header p {
    font-size: 1rem;
  }
  
  .content-features {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .feature-item {
    padding: 20px;
  }
  
  .content-stats {
    flex-direction: column;
    gap: 20px;
  }
  
  .bg-circle {
    display: none;
  }
}
</style>
