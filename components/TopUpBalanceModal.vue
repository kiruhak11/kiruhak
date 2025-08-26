<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click="$emit('close')">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Пополнить баланс</h3>
          <button @click="$emit('close')" class="close-btn">×</button>
        </div>

        <div class="topup-content">
          <p class="current-balance">Текущий баланс: {{ formattedBalance }}</p>

          <div class="amount-options">
            <button
              v-for="amount in topUpAmounts"
              :key="amount"
              @click="selectedAmount = amount"
              :class="['amount-btn', { active: selectedAmount === amount }]"
            >
              {{ amount }}₽
            </button>
          </div>

          <div class="custom-amount">
            <label for="customAmount">Или введите сумму:</label>
            <input
              id="customAmount"
              v-model.number="customAmount"
              type="number"
              min="1"
              placeholder="Введите сумму"
            />
          </div>

          <div class="form-actions">
            <button type="button" @click="$emit('close')" class="cancel-btn">
              Отмена
            </button>
            <button
              @click="handleTopUp"
              :disabled="!canTopUp || toppingUp"
              class="topup-submit-btn"
            >
              {{ toppingUp ? "Пополнение..." : "Пополнить" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  show: boolean;
  formattedBalance: string;
}>();

const emit = defineEmits<{
  close: [];
  balanceUpdated: [];
}>();

// Логирование при изменении show
watch(
  () => props.show,
  (newValue) => {
    console.log("🔐 TopUpBalanceModal show changed:", newValue);
  }
);

const toppingUp = ref(false);

// Пополнение баланса
const topUpAmounts = [100, 300, 500, 1000, 2000];
const selectedAmount = ref(300);
const customAmount = ref(null);

const canTopUp = computed(() => {
  const amount = customAmount.value || selectedAmount.value;
  return amount && amount > 0;
});

const handleTopUp = async () => {
  console.log("🔐 Попытка пополнения баланса");
  const amount = customAmount.value || selectedAmount.value;
  console.log("🔐 Сумма для пополнения:", amount);

  if (!amount || amount <= 0) {
    alert("Пожалуйста, выберите сумму для пополнения");
    return;
  }

  toppingUp.value = true;
  try {
    const { apiFetch } = useApi();
    const response = await apiFetch("/api/user/topup", {
      method: "POST",
      body: { amount },
    });

    if (response?.success) {
      console.log("✅ Баланс успешно пополнен:", response);
      alert(`Баланс успешно пополнен на ${amount}₽!`);
      emit("close");

      // Сброс формы
      selectedAmount.value = 300;
      customAmount.value = null;

      // Обновляем данные пользователя
      const { refreshUser } = useAuth();
      await refreshUser();

      // Уведомляем родительский компонент об обновлении баланса
      emit("balanceUpdated");
    } else {
      console.error("❌ Ошибка пополнения баланса:", response?.error);
      alert(
        "Ошибка при пополнении баланса: " +
          (response?.error || "Неизвестная ошибка")
      );
    }
  } catch (error) {
    console.error("Error topping up balance:", error);
    alert("Ошибка при пополнении баланса");
  } finally {
    toppingUp.value = false;
  }
};
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-content {
  background: var(--background-color);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  z-index: 10000;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0 1.5rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1.5rem;

  h3 {
    margin: 0;
    color: var(--text-color);
    font-size: 1.2rem;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--text-color);
    cursor: pointer;
    padding: 0;
    line-height: 1;
    transition: color 0.2s ease;

    &:hover {
      color: var(--accent-color);
    }
  }
}

.topup-content {
  padding: 0 1.5rem 1.5rem 1.5rem;

  .current-balance {
    text-align: center;
    color: var(--text-color);
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
    font-weight: 500;
  }

  .amount-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1.5rem;

    .amount-btn {
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--background-color);
      color: var(--text-color);
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 500;
      font-size: 0.9rem;

      &:hover {
        border-color: var(--accent-color);
        background: var(--background-color-hover);
        transform: translateY(-1px);
      }

      &.active {
        background: linear-gradient(135deg, #4caf50, #45a049);
        color: white;
        border-color: transparent;
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
      }
    }
  }

  .custom-amount {
    margin-bottom: 1.5rem;

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--text-color);
      font-weight: 500;
    }

    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--background-color);
      color: var(--text-color);
      font-size: 1rem;

      &:focus {
        outline: none;
        border-color: var(--accent-color);
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }
    }
  }
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;

  button {
    flex: 1;
    padding: 0.75rem;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &.cancel-btn {
      background: transparent;
      color: var(--text-color);
      border: 1px solid var(--border-color);

      &:hover {
        background: var(--background-color-hover);
      }
    }

    &.topup-submit-btn {
      background: linear-gradient(135deg, #4caf50, #45a049);
      color: white;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }
  }
}
</style>
