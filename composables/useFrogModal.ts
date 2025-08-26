import { ref, readonly } from "vue";

interface ModalState {
  isOpen: boolean;
  component: any;
  props: any;
}

// Глобальная переменная для хранения состояния модального окна
let globalModalState: ReturnType<typeof ref<ModalState>> | null = null;

export const useFrogModal = () => {
  // Создаем состояние только один раз
  if (!globalModalState) {
    globalModalState = ref<ModalState>({
      isOpen: false,
      component: null,
      props: {},
    });
  }

  const setModal = (component: any, props: any = {}) => {
    if (globalModalState) {
      globalModalState.value = {
        isOpen: true,
        component,
        props,
      };
    }
  };

  const closeModal = () => {
    if (globalModalState) {
      globalModalState.value = {
        isOpen: false,
        component: null,
        props: {},
      };
    }
  };

  return {
    modalState: readonly(globalModalState!),
    setModal,
    closeModal,
  };
};
