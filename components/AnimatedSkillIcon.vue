<template>
  <div class="skill-icon" :class="type">
    <div class="icon-container">
      <slot />
    </div>
    <div class="skill-name">{{ name }}</div>
  </div>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'frontend',
    validator: (value) => ['frontend', 'backend', 'mobile', 'devops'].includes(value)
  }
})
</script>

<style lang="scss" scoped>
.skill-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: var(--background-color-secondary);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: var(--card-shadow-hover);
    border-color: var(--color-accent);
    
    .icon-container {
      transform: scale(1.2) rotate(5deg);
    }
  }
  
  &.frontend:hover {
    border-color: #61dafb;
    .icon-container { color: #61dafb; }
  }
  
  &.backend:hover {
    border-color: #f7df1e;
    .icon-container { color: #f7df1e; }
  }
  
  &.mobile:hover {
    border-color: #ff6b6b;
    .icon-container { color: #ff6b6b; }
  }
  
  &.devops:hover {
    border-color: #4ecdc4;
    .icon-container { color: #4ecdc4; }
  }
}

.icon-container {
  font-size: 3rem;
  transition: all 0.3s ease;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.skill-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
}

@media (max-width: 768px) {
  .skill-icon {
    padding: 16px;
  }
  
  .icon-container {
    font-size: 2.5rem;
  }
  
  .skill-name {
    font-size: 0.9rem;
  }
}
</style> 