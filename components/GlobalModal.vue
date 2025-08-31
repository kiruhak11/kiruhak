<template>
  <client-only>
    <FrogModalWrapper
      v-if="modalState && modalState.isOpen"
      :is-open="modalState.isOpen"
      :desktop-position="FrogModalWrapperPosition.CENTER"
      :mobile-position="FrogModalWrapperPosition.BOTTOM"
      @close="closeModal"
    >
      <component
        v-if="modalState.component"
        :is="getComponent(modalState.component)"
        v-bind="modalState.props"
        @close="closeModal"
        @click.stop
      />
    </FrogModalWrapper>
  </client-only>
</template>

<script setup>
import { defineAsyncComponent } from "vue";
import { FrogModalWrapperPosition } from "~/util/modal-positions";
import FrogModalWrapper from "~/components/FrogModalWrapper.vue";

const { modalState, closeModal } = useFrogModal();

// Импортируем компоненты напрямую
import OrderModal from "~/components/OrderModal.vue";
import DonationModal from "~/components/DonationModal.vue";

const componentMap = {
  OrderModal,
  DonationModal,
};

const getComponent = (componentName) => {
  return componentMap[componentName] || componentName;
};
</script>

<style scoped>
.debug-info {
  position: fixed;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-size: 12px;
  z-index: 9999;
}
</style>
