<template>
    <div class="typewriter">{{ displayedText }}</div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  
  const props = defineProps({
    text: {
      type: String,
      default: '',
    },
    speed: {
      type: Number,
      default: 100,
    }
  });
  const displayedText = ref('');
  let index = 0;
  
  function type() {
    if (index < props.text.length) {
      displayedText.value += props.text.charAt(index);
      index++;
      setTimeout(type, props.speed);
    }
  }
  
  onMounted(() => {
    displayedText.value = '';
    index = 0;
    type();
  });
  </script>
  
  <style lang="scss" scoped>
  .typewriter {
    font-size: 2rem;
    font-weight: bold;
    color: var(--color-accent);
    white-space: nowrap;
    overflow: hidden;
    border-right: 2px solid var(--color-accent);
    animation: blink 0.7s infinite;
    padding: 8px;
  }
  @keyframes blink {
    0% { border-color: transparent; }
    50% { border-color: var(--color-accent); }
    100% { border-color: transparent; }
  }
  </style>
  