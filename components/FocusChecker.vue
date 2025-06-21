<template>
    <div class="focus-checker" :class="{ focused: isFocused }">
      <div class="focus-content">
        <div class="focus-icon">
          <svg v-if="isFocused" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M15 9L9 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 9L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="focus-text">
          <span class="focus-status">{{ isFocused ? 'Страница активна' : 'Страница неактивна' }}</span>
          <span class="focus-description">{{ isFocused ? 'Вы работаете с сайтом' : 'Переключитесь на вкладку' }}</span>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  
  const isFocused = ref(true);
  const handleFocus = () => isFocused.value = true;
  const handleBlur = () => isFocused.value = false;
  
  onMounted(() => {
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('blur', handleBlur);
  });
  </script>
  
  <style lang="scss" scoped>
  .focus-checker {
    background: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 20px;
    box-shadow: var(--card-shadow);
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    animation: slideInUp 0.6s ease-out;
    
    &.focused {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1));
      border-color: var(--success-color);
      box-shadow: 0 8px 25px rgba(34, 197, 94, 0.2);
      
      .focus-icon {
        color: var(--success-color);
        animation: pulse 2s infinite;
      }
    }
    
    &:not(.focused) {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1));
      border-color: var(--error-color);
      box-shadow: 0 8px 25px rgba(239, 68, 68, 0.2);
      
      .focus-icon {
        color: var(--error-color);
      }
    }
  }
  
  .focus-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .focus-icon {
    flex-shrink: 0;
    transition: all 0.3s ease;
  }
  
  .focus-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .focus-status {
    font-weight: 600;
    font-size: 16px;
    color: var(--color-text);
  }
  
  .focus-description {
    font-size: 14px;
    color: var(--color-text-secondary);
  }
  
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
  
  @media (max-width: 768px) {
    .focus-checker {
      padding: 16px;
    }
    
    .focus-content {
      gap: 12px;
    }
    
    .focus-status {
      font-size: 14px;
    }
    
    .focus-description {
      font-size: 12px;
    }
  }
  </style>
  