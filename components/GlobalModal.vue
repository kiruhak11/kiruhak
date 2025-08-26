<template>
  <client-only>
    <FrogModalWrapper
      v-if="modalState"
      :is-open="modalState.isOpen"
      :desktop-position="FrogModalWrapperPosition.CENTER"
      :mobile-position="FrogModalWrapperPosition.BOTTOM"
      @close="closeModal"
    >
      <component
        v-if="modalState.component"
        :is="modalState.component"
        v-bind="modalState.props"
        @close="closeModal"
      />
    </FrogModalWrapper>
  </client-only>
</template>

<script setup>
import { FrogModalWrapperPosition } from "~/util/modal-positions";
import FrogModalWrapper from "~/components/FrogModalWrapper.vue";

const { modalState, closeModal } = useFrogModal();
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
