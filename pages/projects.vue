<template>
  <NuxtLayout>
    <main>
      <div class="container">
        <div class="label">
          <h1>
            <GradientText variant="primary">Проекты</GradientText>
          </h1>
          <p class="subtitle">Мои работы в веб-разработке</p>
        </div>
        
        <div class="cards">
          <ProjectCard
            :project="projects[0]"
            @openModal="setModal(ProjectModal, { project: projects[0] })"
            @visitProject="visitProject"
          />

          <ProjectCard
            :project="projects[1]"
            @openModal="setModal(ProjectModal, { project: projects[1] })"
            @visitProject="visitProject"
          />

          <ProjectCard
            :project="projects[2]"
            @openModal="setModal(ProjectModal, { project: projects[2] })"
            @visitProject="visitProject"
          />

          <ProjectCard
            :project="projects[3]"
            @openModal="setModal(ProjectModal, { project: projects[3] })"
            @visitProject="visitProject"
          />
        </div>
        
        <div class="cta-section">
          <h2>
            <GradientText variant="secondary">Нужен сайт для вашего бизнеса?</GradientText>
          </h2>
          <p>Создам современный и функциональный веб-сайт, который поможет вашему бизнесу расти</p>
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
      

    </main>
  </NuxtLayout>
</template>

<script setup lang="ts">
import GradientText from '~/components/GradientText.vue'
import { statuses } from '~/util/statuses'
import ProjectModal from '~/components/ProjectModal.vue'
import DonationModal from '~/components/DonationModal.vue'
import OrderModal from '~/components/OrderModal.vue'

const { setModal } = useFrogModal()
// Данные проектов
const projects = ref([
  {
    id: 1,
    title: "KES - Сайт КотлоЭнергоСнаб",
    url: "https://kes.kiruhak11.ru",
    startDate: "15.01.2025",
    status: statuses.DEVELOPMENT,
    description: "Комплексная система управления предприятием с модулями учета, аналитики и отчетности. Включает в себя CRM, управление складом, финансовый учет и аналитические дашборды.",
    technologies: ["Vue.js", "Node.js", "Telegram bot", "Supabase", "Docker", "Nginx"],
    image: "https://placehold.co/300x200?text=KES+System"
  },
  {
    id: 2,
    title: "AirPods Store",
    url: "https://airpodsstore.kiruhak11.ru",
    startDate: "01.09.2024",
    status: statuses.DEVELOPMENT,
    description: "Интернет-магазин аксессуаров для Apple устройств. Современный дизайн, удобная навигация, корзина покупок и система оплаты.",
    technologies: ["Vue.js", "Nuxt.js", "SCSS", "supabase", "Responsive Design"],
    image: "https://placehold.co/300x200?text=AirPods+Store"
  },
  {
    id: 3,
    title: "Mixer Timetable",
    url: "https://mixers-adalin.ru",
    startDate: "01.01.2025",
    status: statuses.COMPLETED,
    description: "Веб-приложение для управления расписанием и планирования задач. Интуитивный интерфейс, календарь событий и система уведомлений.",
    technologies: ["Vue.js", "TypeScript", "PDF"],
    image: "https://placehold.co/300x200?text=Mixer+Timetable"
  },
  {
    id: 4,
    title: "DevHorizon",
    url: "https://devhorizon.kiruhak11.ru",
    startDate: "01.10.2024",
    status: statuses.STOPPED,
    description: "Платформа для разработчиков с блогами, туториалами и обменом опытом. Система комментариев, рейтингов и поиска контента.",
    technologies: ["Vue.js", "Express.js", "MongoDB", "JWT", "Markdown"],
    image: "https://placehold.co/300x200?text=DevHorizon"
  }
])

// Состояние модальных окон
const isProjectModalOpen = ref(false)
const isDonationModalOpen = ref(false)
const isOrderModalOpen = ref(false)
const selectedProject = ref({})

// Функции для работы с модальными окнами
const openProjectModal = (project) => {
  selectedProject.value = project
  isProjectModalOpen.value = true
}

const closeProjectModal = () => {
  isProjectModalOpen.value = false
  selectedProject.value = {}
}

const visitProject = (project) => {
  window.open(project.url, '_blank')
}

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
  padding: 0 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.label {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  text-align: center;
}

h1 {
  display: flex;
  justify-content: center;
  padding: 32px 0 16px;
  color: var(--color-text);
  transform: scale(0.9);
  animation: fadeIn 0.7s ease forwards;
  animation-delay: 0.3s;
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 1.1rem;
  margin: 0;
  animation: fadeIn 0.7s ease forwards;
  animation-delay: 0.5s;
  opacity: 0;
}

@keyframes fadeIn {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  margin: 48px 0;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

.cta-section {
  text-align: center;
  margin: 64px 0;
  padding: 48px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 20px;
  border: 1px solid var(--background-info-color);
  
  h2 {
    margin: 0 0 16px 0;
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text);
  }
  
  p {
    margin: 0 0 32px 0;
    font-size: 1.1rem;
    color: var(--color-text-secondary);
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
  text-decoration: none;
  
  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .cta-section {
    padding: 32px 24px;
    margin: 48px 0;
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
