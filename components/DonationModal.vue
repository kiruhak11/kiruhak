<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="modal-overlay"
      :class="{ visible: isVisible }"
      @click="closeModal"
    >
      <div class="modal-content" :class="{ visible: isVisible }" @click.stop>
        <button class="close-button" @click="closeModal">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <div class="modal-body">
          <div class="donation-header">
            <div class="heart-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h2>Поддержать проект</h2>
            <p>
              Если вам нравится моя работа, вы можете поддержать развитие
              проекта
            </p>
          </div>

          <div class="donation-options">
            <div class="amount-options">
              <button
                v-for="amount in amounts"
                :key="amount"
                class="amount-button"
                :class="{ active: selectedAmount === amount }"
                @click="selectedAmount = amount"
              >
                {{ amount }}₽
              </button>
              <div class="custom-amount">
                <input
                  v-model="customAmount"
                  type="number"
                  placeholder="Другая сумма"
                  min="1"
                  @input="selectedAmount = null"
                />
                <span class="currency">₽</span>
              </div>
            </div>

            <div class="payment-methods">
              <h3>Способы оплаты</h3>
              <div class="method-buttons">
                <button class="method-button telegram" @click="openTelegram">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22 2L11 13"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M22 2L15 22L11 13L2 9L22 2Z"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  Telegram
                </button>
                <button class="method-button card" @click="copyCardNumber">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="1"
                      y="4"
                      width="22"
                      height="16"
                      rx="2"
                      ry="2"
                      stroke="currentColor"
                      stroke-width="2"
                    />
                    <line
                      x1="1"
                      y1="10"
                      x2="23"
                      y2="10"
                      stroke="currentColor"
                      stroke-width="2"
                    />
                  </svg>
                  Банковская карта
                </button>
              </div>
            </div>
          </div>

          <div class="donation-footer">
            <p class="thank-you">Спасибо за поддержку! 🙏</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import SuccessModal from "~/components/SuccessModal.vue";
import InfoModal from "~/components/InfoModal.vue";
import { useFrogModal } from "#imports";
import { publicContact } from "~/constants/public-contact";

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits(["close"]);

const amounts = [100, 300, 500, 1000];
const selectedAmount = ref(300);
const customAmount = ref("");
const isVisible = ref(false);

const { setModal } = useFrogModal();

// Следим за изменением show
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      document.body.style.overflow = "hidden";
      // Небольшая задержка для анимации
      setTimeout(() => {
        isVisible.value = true;
      }, 50);
    } else {
      isVisible.value = false;
      document.body.style.overflow = "";
    }
  }
);

const closeModal = () => {
  isVisible.value = false;
  // Добавляем анимацию закрытия
  const modalContent = document.querySelector(".modal-content") as HTMLElement;
  if (modalContent) {
    modalContent.style.animation = "modalClose 0.3s ease forwards";
  }

  setTimeout(() => {
    emit("close");
  }, 300); // Время анимации
};

const openTelegram = () => {
  const amount = selectedAmount.value || customAmount.value;
  const message = `Привет! Хочу поддержать проект на сумму ${amount}₽`;
  const telegramUrl = `${publicContact.telegram.href}?text=${encodeURIComponent(
    message
  )}`;
  window.open(telegramUrl, "_blank", "noopener,noreferrer");

  // Закрываем текущее модальное окно
  closeModal();

  // Показываем уведомление
  setTimeout(() => {
    setModal(SuccessModal, {
      title: "Спасибо за поддержку!",
      message: "Ваша поддержка помогает развивать проект. Спасибо! 🙏",
      buttonText: "Понятно",
    });
  }, 300);
};

const copyCardNumber = () => {
  const cardNumber = "2200 2460 6394 8171"; // Замените на реальный номер карты
  navigator.clipboard
    .writeText(cardNumber)
    .then(() => {
      // Показываем уведомление
      setModal(InfoModal, {
        title: "Номер карты скопирован!",
        message: "Номер банковской карты скопирован в буфер обмена.",
        buttonText: "Отлично!",
      });
    })
    .catch(() => {
      // Показываем уведомление об ошибке
      setModal(InfoModal, {
        title: "Ошибка копирования",
        message:
          "Не удалось скопировать номер карты. Попробуйте скопировать вручную: 2200 2460 6394 8171",
        buttonText: "Понятно",
      });
    });
};
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.3s ease;
  backdrop-filter: blur(5px);

  &.visible {
    opacity: 1;
  }
}

.modal-content {
  background: var(--background-color);
  padding: 2rem;
  border-radius: 20px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transform: scale(0.9);
  opacity: 0;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  position: relative;

  &.visible {
    transform: scale(1);
    opacity: 1;
    animation: modalOpen 0.3s ease forwards;
  }
}

@keyframes modalOpen {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes modalClose {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.9);
    opacity: 0;
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

.donation-header {
  text-align: center;
  margin-bottom: 32px;

  .heart-icon {
    color: var(--error-color);
    margin-bottom: 16px;
    animation: heartbeat 2s infinite;
  }

  @keyframes heartbeat {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 700;
    color: var(--color-text);
    background: var(--gradient-secondary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 16px;
    line-height: 1.5;
  }
}

.donation-options {
  margin-bottom: 32px;
}

.amount-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.amount-button {
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  background: var(--background-color);
  color: var(--color-text);
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-accent);
    transform: translateY(-2px);
  }

  &.active {
    background: var(--gradient-secondary);
    border-color: transparent;
    color: white;
  }
}

.custom-amount {
  position: relative;
  grid-column: 1 / -1;

  input {
    width: 100%;
    padding: 12px 40px 12px 16px;
    border: 2px solid var(--border-color);
    background: var(--background-color);
    color: var(--color-text);
    border-radius: 12px;
    font-size: 16px;

    &:focus {
      outline: none;
      border-color: var(--color-accent);
    }
  }

  .currency {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-secondary);
    font-weight: 600;
  }
}

.payment-methods {
  h3 {
    margin: 0 0 16px 0;
    font-size: 18px;
    color: var(--color-text);
  }
}

.method-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.method-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border: 2px solid var(--border-color);
  background: var(--background-color);
  color: var(--color-text);
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--card-shadow);
  }

  &.telegram:hover {
    border-color: #0088cc;
    color: #0088cc;
  }

  &.card:hover {
    border-color: var(--success-color);
    color: var(--success-color);
  }
}

.donation-footer {
  text-align: center;

  .thank-you {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 14px;
    font-style: italic;
  }
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: env(safe-area-inset-top) 12px env(safe-area-inset-bottom);
    align-items: flex-end;
  }

  .modal-content {
    width: 100%;
    max-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    border-radius: 20px 20px 0 0;
  }

  .modal-body {
    padding: 24px;
  }

  .amount-options {
    grid-template-columns: repeat(2, 1fr);
  }

  .method-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
