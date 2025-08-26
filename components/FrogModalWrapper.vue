<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isModalOpen" class="frog-modal-wrapper" :class="positionClass">
        <div class="modal-backdrop" @click="handleClose"></div>
        <div class="modal-container" :class="positionClass">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  desktopPosition: {
    type: String,
    default: "CENTER",
  },
  mobilePosition: {
    type: String,
    default: "BOTTOM",
  },
});

// Используем только props для определения состояния
const isModalOpen = computed(() => props.isOpen);

const handleClose = () => {
  $emit("close");
};

const positionClass = computed(() => {
  return {
    "position-center": props.desktopPosition === "CENTER",
    "position-bottom": props.mobilePosition === "BOTTOM",
  };
});

defineEmits(["close"]);
</script>

<style lang="scss" scoped>
.frog-modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  background: var(--background-color);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
}

.position-center {
  align-items: center;
  justify-content: center;
}

.position-bottom {
  align-items: flex-end;
  justify-content: center;
}

// Transitions
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

@media (max-width: 768px) {
  .modal-container {
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 16px 16px 0 0;
  }

  .position-bottom .modal-container {
    border-radius: 16px 16px 0 0;
  }
}

.debug-modal-info {
  position: fixed;
  top: 50px;
  left: 10px;
  background: rgba(255, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-size: 12px;
  z-index: 9999;
}
</style>
