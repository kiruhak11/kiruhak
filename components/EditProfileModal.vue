<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click="$emit('close')">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Редактировать профиль</h3>
          <button @click="$emit('close')" class="close-btn">×</button>
        </div>

        <form @submit.prevent="saveProfile">
          <div class="form-group">
            <label for="firstName">Имя</label>
            <input
              id="firstName"
              v-model="editForm.firstName"
              type="text"
              required
            />
          </div>
          <div class="form-group">
            <label for="lastName">Фамилия</label>
            <input id="lastName" v-model="editForm.lastName" type="text" />
          </div>
          <div class="form-group">
            <label for="username">Имя пользователя</label>
            <input id="username" v-model="editForm.username" type="text" />
          </div>
          <div class="form-actions">
            <button type="button" @click="$emit('close')" class="cancel-btn">
              Отмена
            </button>
            <button type="submit" :disabled="saving" class="save-btn">
              {{ saving ? "Сохранение..." : "Сохранить" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  show: boolean;
  user: any;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const saving = ref(false);

const editForm = ref({
  firstName: props.user?.firstName || "",
  lastName: props.user?.lastName || "",
  username: props.user?.username || "",
});

// Обновляем форму при изменении пользователя
watch(
  () => props.user,
  (newUser) => {
    if (newUser) {
      editForm.value = {
        firstName: newUser.firstName || "",
        lastName: newUser.lastName || "",
        username: newUser.username || "",
      };
    }
  },
  { immediate: true }
);

const saveProfile = async () => {
  saving.value = true;
  try {
    const { apiFetch } = useApi();
    const response = (await apiFetch("/api/user/me", {
      method: "PUT",
      body: editForm.value,
    })) as any;

    if (response?.success) {
      emit("saved");
      emit("close");
      alert("Профиль обновлен!");
    } else {
      alert(
        "Ошибка при обновлении профиля: " +
          (response?.error || "Неизвестная ошибка")
      );
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    alert("Ошибка при обновлении профиля");
  } finally {
    saving.value = false;
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

.form-group {
  margin-bottom: 1rem;
  padding: 0 1.5rem;

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
    }
  }
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 0 1.5rem 1.5rem 1.5rem;

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

    &.save-btn {
      background: var(--gradient-primary);
      color: white;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }
  }
}
</style>
