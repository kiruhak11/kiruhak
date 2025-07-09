<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  show: boolean;
  discount: number;
}>();

const emit = defineEmits(["close", "submit"]);

const phone = ref("");
const message = ref("");
const isLoading = ref(false);
const error = ref("");
const isVisible = ref(false);

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

const validatePhone = (phone: string) => {
  const phoneRegex =
    /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
  return phoneRegex.test(phone);
};

const handleSubmit = async () => {
  error.value = "";

  if (!validatePhone(phone.value)) {
    error.value = "Пожалуйста, введите корректный номер телефона";
    return;
  }

  isLoading.value = true;

  try {
    const response = await fetch("/api/telegram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: phone.value,
        message: message.value,
        discount: props.discount,
      }),
    });

    if (!response.ok) throw new Error("Ошибка отправки");

    emit("submit");
    phone.value = "";
    message.value = "";
  } catch (e) {
    error.value =
      "Произошла ошибка при отправке. Пожалуйста, попробуйте позже.";
  } finally {
    isLoading.value = false;
  }
};

const closeModal = () => {
  isVisible.value = false;
  setTimeout(() => {
    emit("close");
  }, 300); // Время анимации
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="modal-overlay"
      :class="{ visible: isVisible }"
      @click="closeModal"
    >
      <div class="modal-content" :class="{ visible: isVisible }" @click.stop>
        <div class="modal-header">
          <h2>Поздравляем! 🎉</h2>
          <button class="close-button" @click="closeModal">×</button>
        </div>

        <div class="discount-animation">
          <div class="discount-circle">
            <span class="discount-value">{{ discount }}%</span>
            <span class="discount-label">скидка</span>
          </div>
        </div>

        <p class="description">
          Оставьте свои контакты, и я свяжусь с вами для обсуждения проекта с
          учетом вашей скидки!
        </p>

        <form @submit.prevent="handleSubmit" class="contact-form">
          <div class="form-group">
            <label for="phone">Телефон*</label>
            <input
              id="phone"
              v-model="phone"
              type="tel"
              placeholder="+7 (999) 999-99-99"
              required
            />
          </div>

          <div class="form-group">
            <label for="message">Сообщение</label>
            <textarea
              id="message"
              v-model="message"
              placeholder="Опишите ваш проект..."
              rows="4"
            ></textarea>
          </div>

          <p v-if="error" class="error-message">{{ error }}</p>

          <button type="submit" :disabled="isLoading">
            <span class="button-content">
              {{ isLoading ? "Отправка..." : "Отправить" }}
            </span>
            <span class="button-shine"></span>
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
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

  &.visible {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    margin: 0;
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 1.8rem;
  }
}

.close-button {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--color-text);
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.3s ease;

  &:hover {
    color: var(--color-primary);
  }
}

.discount-animation {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
}

.discount-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: var(--gradient-primary);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  animation: pulse 2s infinite;

  .discount-value {
    font-size: 2.5rem;
    font-weight: bold;
    line-height: 1;
  }

  .discount-label {
    font-size: 1rem;
    opacity: 0.9;
  }
}

.description {
  text-align: center;
  color: var(--color-text);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.contact-form {
  .form-group {
    margin-bottom: 1.5rem;

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--color-text);
      font-weight: 500;
    }

    input,
    textarea {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid var(--border-color);
      border-radius: 10px;
      font-size: 1rem;
      background: var(--background-color);
      color: var(--color-text);
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      &::placeholder {
        color: var(--color-text-secondary);
      }
    }
  }

  button {
    width: 100%;
    padding: 1rem;
    background: var(--gradient-primary);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
    }

    &:disabled {
      background: #cccccc;
      cursor: not-allowed;
      transform: none;
    }

    .button-content {
      position: relative;
      z-index: 1;
    }

    .button-shine {
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        120deg,
        transparent,
        rgba(255, 255, 255, 0.3),
        transparent
      );
      animation: shine 3s infinite;
    }
  }
}

.error-message {
  color: #ef4444;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.9rem;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0);
  }
}

@keyframes shine {
  0% {
    left: -100%;
  }
  20% {
    left: 100%;
  }
  100% {
    left: 100%;
  }
}

@media (max-width: 768px) {
  .modal-content {
    padding: 1.5rem;
    width: 95%;
  }

  .modal-header h2 {
    font-size: 1.5rem;
  }

  .discount-circle {
    width: 100px;
    height: 100px;

    .discount-value {
      font-size: 2rem;
    }

    .discount-label {
      font-size: 0.9rem;
    }
  }
}
</style>
