<template>
  <div class="discount-button-container">
    <button @click="showDiscountModal" class="discount-button">
      <div class="button-content">
        <div class="discount-badge">15%</div>
        <div class="button-text">
          <span class="main-text">Получить скидку</span>
          <span class="sub-text">на первый сайт</span>
        </div>
      </div>
      <div class="button-shine"></div>
    </button>
  </div>
</template>

<script setup>
import { ref } from "vue";

const emit = defineEmits(["show-discount"]);

const showDiscountModal = () => {
  emit("show-discount", "15%");
};
</script>

<style scoped>
.discount-button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}

.discount-button {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 20px;
  padding: 0;
  cursor: pointer;
  transform-style: preserve-3d;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.discount-button:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.discount-button:active {
  transform: translateY(-2px) scale(0.98);
}

.button-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem 2rem;
  z-index: 2;
}

.discount-badge {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
  font-weight: bold;
  font-size: 1.5rem;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transform: rotate(-5deg);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: rotate(-5deg) scale(1);
  }
  50% {
    transform: rotate(-5deg) scale(1.05);
  }
}

.button-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  color: white;
}

.main-text {
  font-size: 1.3rem;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.sub-text {
  font-size: 0.9rem;
  opacity: 0.9;
  font-weight: 400;
}

.button-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s;
}

.discount-button:hover .button-shine {
  left: 100%;
}

@media (max-width: 768px) {
  .button-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .button-text {
    align-items: center;
  }

  .discount-badge {
    font-size: 1.3rem;
    padding: 0.4rem 0.8rem;
  }

  .main-text {
    font-size: 1.1rem;
  }
}
</style>
