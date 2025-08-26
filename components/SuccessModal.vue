<template>
  <client-only>
    <FrogModalWrapper
      :desktop-position="FrogModalWrapperPosition.CENTER"
      :mobile-position="FrogModalWrapperPosition.CENTER"
      class="modal"
    >
      <div class="modal-content">
        <div class="success-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        
        <div class="modal-body">
          <h2>{{ title }}</h2>
          <p>{{ message }}</p>
          
          <div class="modal-actions">
            <button class="success-button" @click="closeModal">
              {{ buttonText }}
            </button>
          </div>
        </div>
      </div>
    </FrogModalWrapper>
  </client-only>
</template>

<script setup lang="ts">
import { useFrogModal } from "~/composables/useFrogModal";

const props = defineProps({
  title: {
    type: String,
    default: 'Успешно!'
  },
  message: {
    type: String,
    default: 'Операция выполнена успешно'
  },
  buttonText: {
    type: String,
    default: 'Понятно'
  }
})

const { closeModal } = useFrogModal()
</script>

<style lang="scss" scoped>
.modal {
  opacity: 1;
}

.modal-content {
  background: var(--background-color);
  border-radius: 20px;
  max-width: 400px;
  width: 100%;
  position: relative;
  border: 1px solid var(--border-color);
  box-shadow: var(--card-shadow-hover);
  animation: successSlideIn 0.4s ease-out;
}

@keyframes successSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.success-icon {
  display: flex;
  justify-content: center;
  padding: 32px 32px 0 32px;
  color: var(--success-color);
  animation: successPulse 0.6s ease-out 0.2s both;
}

@keyframes successPulse {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-body {
  padding: 0 32px 32px 32px;
  text-align: center;
  
  h2 {
    margin: 0 0 12px 0;
    font-size: 24px;
    font-weight: 700;
    color: var(--color-text);
  }
  
  p {
    margin: 0 0 24px 0;
    color: var(--color-text-secondary);
    font-size: 16px;
    line-height: 1.5;
  }
}

.modal-actions {
  display: flex;
  justify-content: center;
}

.success-button {
  padding: 12px 32px;
  background: var(--gradient-success);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
  }
}

@media (max-width: 768px) {
  .modal-content {
    margin: 20px;
  }
  
  .modal-body {
    padding: 0 24px 24px 24px;
  }
}
</style> 