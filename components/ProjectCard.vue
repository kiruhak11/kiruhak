<template>
  <div class="project-card" @click="$emit('openModal', project)">
    <div class="card-image">
      <img :src="project.image" :alt="project.title" />
      <div class="image-overlay">
        <div class="overlay-content">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 3H21V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 21H3V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 3L13.5 10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3 21L10.5 13.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
    
    <div class="card-content">
      <div class="card-header">
        <h3 class="project-title">
          <GradientText variant="primary">{{ project.title }}</GradientText>
        </h3>
        <div class="project-status" :class="project.status">
          {{ getStatusText(project.status) }}
        </div>
      </div>
      
      <p class="project-description">{{ project.description }}</p>
      
      <div class="project-tech">
        <span 
          v-for="tech in project.technologies.slice(0, 3)" 
          :key="tech" 
          class="tech-tag"
        >
          {{ tech }}
        </span>
        <span v-if="project.technologies.length > 3" class="tech-tag more">
          +{{ project.technologies.length - 3 }}
        </span>
      </div>
      
      <div class="card-actions">
        <button class="action-button primary" @click.stop="$emit('visitProject', project)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="15,3 21,3 21,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Посетить
        </button>
        <button class="action-button secondary" @click.stop="$emit('openModal', project)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Подробнее
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import GradientText from './GradientText.vue'
import { getStatusText } from '~/util/statuses'

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

defineEmits(['openModal', 'visitProject'])

</script>

<style lang="scss" scoped>
.project-card {
  background: var(--background-color);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid var(--border-color);
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: var(--card-shadow-hover);
    
    .image-overlay {
      opacity: 1;
    }
    
    .card-image img {
      transform: scale(1.05);
    }
  }
}

.card-image {
  position: relative;
  height: 200px;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  .overlay-content {
    color: white;
    font-size: 2rem;
  }
}

.card-content {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.project-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
  flex: 1;
}

.project-status {
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  &.active {
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
  }
  
  &.completed {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }
  
  &.development {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }
  
  &.maintenance {
    background: rgba(168, 85, 247, 0.1);
    color: #a855f7;
  }
  &.stopped {
    background: rgba(245, 158, 11, 0.1);
    color: #f50b0b;
  }
}

.project-description {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.tech-tag {
  padding: 4px 8px;
  background: var(--background-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  
  &.more {
    background: var(--color-accent);
    color: white;
    border-color: var(--color-accent);
  }
}

.card-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  
  &.primary {
    background: var(--gradient-primary);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
  }
  
  &.secondary {
    background: var(--background-color-secondary);
    color: var(--color-text);
    border: 1px solid var(--border-color);
    
    &:hover {
      background: var(--color-accent);
      color: white;
      border-color: var(--color-accent);
    }
  }
}

@media (max-width: 768px) {
  .card-content {
    padding: 16px;
  }
  
  .project-title {
    font-size: 1.1rem;
  }
  
  .card-actions {
    flex-direction: column;
  }
  
  .action-button {
    justify-content: center;
  }
}
</style>
