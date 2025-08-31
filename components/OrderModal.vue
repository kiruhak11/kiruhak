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
          <div class="order-header">
            <div class="code-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <polyline
                  points="16,18 22,12 16,6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <polyline
                  points="8,6 2,12 8,18"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <h2>Заказать сайт</h2>
            <p>
              Расскажите о вашем проекте, и я свяжусь с вами для обсуждения
              деталей
            </p>
          </div>

          <form @submit.prevent="submitForm" class="order-form">
            <div class="form-group">
              <label for="name">Имя *</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                required
                placeholder="Ваше имя"
              />
            </div>

            <div class="form-group">
              <label for="contact">Контакты *</label>
              <input
                id="contact"
                v-model="form.contact"
                type="text"
                required
                placeholder="Telegram, телефон или email"
              />
            </div>

            <div class="form-group">
              <label for="projectType">Тип проекта *</label>
              <select id="projectType" v-model="form.projectType" required>
                <option value="">Выберите тип проекта</option>
                <option value="landing">Лендинг</option>
                <option value="corporate">Корпоративный сайт</option>
                <option value="ecommerce">Интернет-магазин</option>
                <option value="blog">Блог</option>
                <option value="portfolio">Портфолио</option>
                <option value="other">Другое</option>
              </select>
            </div>

            <div class="form-group">
              <label for="budget">Бюджет</label>
              <select id="budget" v-model="form.budget">
                <option value="">Не указан</option>
                <option value="small">До 50,000₽</option>
                <option value="medium">50,000₽ - 150,000₽</option>
                <option value="large">150,000₽ - 500,000₽</option>
                <option value="enterprise">Более 500,000₽</option>
              </select>
            </div>

            <div class="form-group">
              <label for="deadline">Сроки</label>
              <select id="deadline" v-model="form.deadline">
                <option value="">Не указаны</option>
                <option value="urgent">Срочно (1-2 недели)</option>
                <option value="normal">Обычно (1-2 месяца)</option>
                <option value="flexible">Гибкие сроки</option>
              </select>
            </div>

            <div class="form-group">
              <label for="description">Описание проекта *</label>
              <textarea
                id="description"
                v-model="form.description"
                required
                rows="4"
                placeholder="Опишите ваш проект, цели, функциональность..."
              ></textarea>
            </div>

            <div class="form-actions">
              <button
                type="submit"
                class="submit-button"
                :disabled="isSubmitting"
              >
                <span v-if="isSubmitting" class="loading">
                  <svg
                    class="spinner"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-dasharray="31.416"
                      stroke-dashoffset="31.416"
                    >
                      <animate
                        attributeName="stroke-dasharray"
                        dur="2s"
                        values="0 31.416;15.708 15.708;0 31.416"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="stroke-dashoffset"
                        dur="2s"
                        values="0;-15.708;-31.416"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </svg>
                  Отправка...
                </span>
                <span v-else>Отправить заявку</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import SuccessModal from "~/components/SuccessModal.vue";
import InfoModal from "~/components/InfoModal.vue";
import { useFrogModal } from "~/composables/useFrogModal";

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits(["close"]);

const isSubmitting = ref(false);
const isVisible = ref(false);
const form = ref({
  name: "",
  contact: "",
  projectType: "",
  budget: "",
  deadline: "",
  description: "",
});

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

const resetForm = () => {
  form.value = {
    name: "",
    contact: "",
    projectType: "",
    budget: "",
    deadline: "",
    description: "",
  };
};

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

const submitForm = async () => {
  isSubmitting.value = true;

  try {
    const response = await $fetch("/api/telegram", {
      method: "POST",
      body: {
        message: formatMessage(),
      },
    });

    console.log("Telegram response:", response);

    // Закрываем текущее модальное окно
    closeModal();
    resetForm();

    // Показываем уведомление об успешной отправке
    setTimeout(() => {
      setModal(SuccessModal, {
        title: "Заявка отправлена!",
        message:
          "Я свяжусь с вами в ближайшее время для обсуждения деталей проекта.",
        buttonText: "Отлично!",
      });
    }, 300);
  } catch (error) {
    console.error("Error sending form:", error);

    // Показываем уведомление об ошибке
    setTimeout(() => {
      setModal(InfoModal, {
        title: "Ошибка отправки",
        message:
          "Произошла ошибка при отправке заявки. Попробуйте еще раз или свяжитесь со мной напрямую.",
        buttonText: "Понятно",
      });
    }, 300);
  } finally {
    isSubmitting.value = false;
  }
};

const formatMessage = () => {
  const budgetMap = {
    small: "До 50,000₽",
    medium: "50,000₽ - 150,000₽",
    large: "150,000₽ - 500,000₽",
    enterprise: "Более 500,000₽",
  };

  const deadlineMap = {
    urgent: "Срочно (1-2 недели)",
    normal: "Обычно (1-2 месяца)",
    flexible: "Гибкие сроки",
  };

  const projectTypeMap = {
    landing: "Лендинг",
    corporate: "Корпоративный сайт",
    ecommerce: "Интернет-магазин",
    blog: "Блог",
    portfolio: "Портфолио",
    other: "Другое",
  };

  return `<b>🎯 Новая заявка на разработку сайта</b>

👤 <b>Имя:</b> ${form.value.name}
📞 <b>Контакты:</b> ${form.value.contact}
🏗️ <b>Тип проекта:</b> ${projectTypeMap[form.value.projectType] || "Не указан"}
💰 <b>Бюджет:</b> ${budgetMap[form.value.budget] || "Не указан"}
⏰ <b>Сроки:</b> ${deadlineMap[form.value.deadline] || "Не указаны"}

📝 <b>Описание проекта:</b>
${form.value.description}

---
Отправлено с сайта <a href="https://kiruhak11.ru">kiruhak11.ru</a>`;
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
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
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

.order-header {
  text-align: center;
  margin-bottom: 32px;

  .code-icon {
    color: var(--color-accent);
    margin-bottom: 16px;
  }

  h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 700;
    color: var(--color-text);
    background: var(--gradient-primary);
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

.order-form {
  .form-group {
    margin-bottom: 20px;

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: var(--color-text);
    }

    input,
    select,
    textarea {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid var(--border-color);
      background: var(--background-color);
      color: var(--color-text);
      border-radius: 12px;
      font-size: 16px;
      transition: all 0.2s ease;

      &:focus {
        outline: none;
        border-color: var(--color-accent);
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      &::placeholder {
        color: var(--color-text-muted);
      }
    }

    textarea {
      resize: vertical;
      min-height: 100px;
    }
  }
}

.form-actions {
  margin-top: 32px;
  text-align: center;
}

.submit-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .loading {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 16px;
  }

  .modal-body {
    padding: 24px;
  }

  .order-form {
    .form-group {
      margin-bottom: 16px;
    }
  }
}
</style>
