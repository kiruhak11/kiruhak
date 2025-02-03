<template>
    <div class="focus-checker" :class="{ focused: isFocused }">
      <p v-if="isFocused">Страница в фокусе</p>
      <p v-else>Страница вне фокуса</p>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  
  const isFocused = ref(true);
  const handleFocus = () => isFocused.value = true;
  const handleBlur = () => isFocused.value = false;
  
  onMounted(() => {
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('blur', handleBlur);
  });
  </script>
  
  <style lang="scss" scoped>
  .focus-checker {
    padding: 16px 32px;
    border-radius: 8px;
    background-color: var(--background-color-hover);
    color: var(--color-text);
    box-shadow: 0 0px 16px var(--box-shadow-color);
    transition: background-color 0.3s, box-shadow 0.3s;
    font-size: 1.2rem;
    text-align: center;
  }
  .focus-checker.focused {
    background-color: var(--color-accent);
    color: #fff;
    box-shadow: 0 0px 24px var(--box-shadow-color-hover);
  }
  </style>
  