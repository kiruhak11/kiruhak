<template>
  <client-only>
    <FrogModalWrapper
      :desktop-position="FrogModalWrapperPosition.CENTER"
      :mobile-position="FrogModalWrapperPosition.BOTTOM"
      class="modal"
    >
      <div class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <button class="close-button" @click="closeModal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          
          <div class="modal-body">
            <div class="project-header">
              <div class="project-logo">
                <component :is="project.icon" v-if="project.icon" />
                <div v-else class="default-logo">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
              <div class="project-info">
                <h2>{{ project.title }}</h2>
                <div class="project-meta">
                  <span class="status" :class="statusClass">
                    <span class="status-dot"></span>
                    {{ statusText }}
                  </span>
                  <span class="date">Создан: {{ project.startDate }}</span>
                </div>
              </div>
            </div>
            
            <div class="project-description">
              <h3>Описание</h3>
              <p>{{ project.description }}</p>
            </div>
            
            <div class="project-tech" v-if="project.technologies">
              <h3>Технологии</h3>
              <div class="tech-tags">
                <span v-for="tech in project.technologies" :key="tech" class="tech-tag">
                  {{ tech }}
                </span>
              </div>
            </div>
            
            <div class="project-actions">
              <a 
                :href="project.url" 
                target="_blank" 
                rel="noopener noreferrer"
                class="visit-button"
                :class="{ disabled: !project.isOnline }"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 13V19A2 2 0 0 1 16 21H5A2 2 0 0 1 3 19V8A2 2 0 0 1 5 6H11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <polyline points="15,3 21,3 21,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                {{ project.isOnline ? 'Посетить сайт' : 'Сайт недоступен' }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </FrogModalWrapper>
  </client-only>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  project: {
    type: Object,
    default: () => ({})
  }
})

const { closeModal } = useFrogModal()

const statusText = computed(() => {
  const statusMap = {
    'active': 'Работает',
    'development': 'В разработке',
    'completed': 'Завершен',
    'stopped': 'Приостановлен'
  }
  return statusMap[props.project.status] || 'Неизвестно'
})

const statusClass = computed(() => {
  const classMap = {
    'active': 'status-online',
    'development': 'status-development',
    'completed': 'status-completed',
    'stopped': 'status-offline'
  }
  return classMap[props.project.status] || 'status-unknown'
})
</script>

<style lang="scss" scoped>
.modal {
  opacity: 1;
}

.modal-content {
  background: var(--background-color);
  border-radius: 20px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid var(--border-color);
  box-shadow: var(--card-shadow-hover);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--background-color-secondary);
  border: 1px solid var(--border-color);
  color: var(--color-text);
  cursor: pointer;
  padding: 8px;
  border-radius: 12px;
  transition: all 0.2s ease;
  z-index: 10;
  
  &:hover {
    background: var(--background-color-hover);
    transform: scale(1.1);
    box-shadow: var(--card-shadow);
  }
}

.modal-body {
  padding: 32px;
}

.project-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.project-logo {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background: var(--background-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  border: 2px solid var(--border-color);
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: var(--card-shadow);
  }
  
  .default-logo {
    width: 48px;
    height: 48px;
  }
}

.project-info h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.project-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  &.status-online {
    background: rgba(34, 197, 94, 0.1);
    color: var(--success-color);
    
    .status-dot {
      background: var(--success-color);
    }
  }
  
  &.status-development {
    background: rgba(59, 130, 246, 0.1);
    color: var(--color-accent);
    
    .status-dot {
      background: var(--color-accent);
    }
  }
  
  &.status-completed {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    
    .status-dot {
      background: #10b981;
    }
  }
  
  &.status-offline {
    background: rgba(239, 68, 68, 0.1);
    color: var(--error-color);
    
    .status-dot {
      background: var(--error-color);
    }
  }
  
  &.status-unknown {
    background: rgba(156, 163, 175, 0.1);
    color: var(--color-text-secondary);
    
    .status-dot {
      background: var(--color-text-secondary);
    }
  }
}

.date {
  color: var(--color-text-secondary);
  font-size: 14px;
}

.project-description {
  margin-bottom: 24px;
  
  h3 {
    margin: 0 0 12px 0;
    font-size: 18px;
    color: var(--color-text);
  }
  
  p {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }
}

.project-tech {
  margin-bottom: 32px;
  
  h3 {
    margin: 0 0 12px 0;
    font-size: 18px;
    color: var(--color-text);
  }
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tech-tag {
  padding: 6px 12px;
  background: var(--background-color-secondary);
  border: 1px solid var(--border-color);
  color: var(--color-text);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--color-accent);
    color: white;
    transform: translateY(-1px);
  }
}

.project-actions {
  text-align: center;
}

.visit-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
  background: var(--gradient-primary);
  color: white;
  text-decoration: none;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover:not(.disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }
  
  &.disabled {
    background: var(--background-color-secondary);
    color: var(--color-text-secondary);
    cursor: not-allowed;
    opacity: 0.7;
  }
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 16px;
  }
  
  .modal-body {
    padding: 24px;
  }
  
  .project-header {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .project-meta {
    justify-content: center;
  }
  
  .tech-tags {
    justify-content: center;
  }
}
</style>