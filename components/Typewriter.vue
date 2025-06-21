<template>
    <div class="typewriter-container">
      <h1 class="typewriter-text">
        <span class="gradient-text primary">{{ displayText }}</span>
        <span class="cursor" :class="{ 'cursor-blink': isTyping }">|</span>
      </h1>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  
  const props = defineProps({
    text: {
      type: String,
      required: true
    },
    speed: {
      type: Number,
      default: 100
    },
    delay: {
      type: Number,
      default: 1000
    }
  });
  const displayText = ref('');
  const isTyping = ref(false);
  let currentIndex = 0;
  let timeoutId = null;
  
  const typeText = () => {
    if (currentIndex < props.text.length) {
      displayText.value += props.text[currentIndex];
      currentIndex++;
      timeoutId = setTimeout(typeText, props.speed);
    } else {
      isTyping.value = false;
    }
  };
  
  onMounted(() => {
    setTimeout(() => {
      isTyping.value = true;
      typeText();
    }, props.delay);
  });
  
  onUnmounted(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
  </script>
  
  <style lang="scss" scoped>
  .gradient-text {
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .typewriter-container {
    text-align: center;
    margin: 32px 0;
  }
  
  .typewriter-text {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 3rem;
  }
  
  .cursor {
    color: var(--color-accent);
    font-weight: 700;
    animation: blink 1s infinite;
    
    &.cursor-blink {
      animation: blink 0.7s infinite;
    }
  }
  
  @keyframes blink {
    0%, 50% {
      opacity: 1;
    }
    51%, 100% {
      opacity: 0;
    }
  }
  
  @media (max-width: 768px) {
    .typewriter-text {
      font-size: 1.8rem;
      min-height: 2.5rem;
    }
  }
  </style>
  