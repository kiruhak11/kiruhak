<template>
  <span class="gradient-text" :class="variant">
    <slot />
  </span>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'success', 'warning'].includes(value)
  }
})
</script>

<style lang="scss" scoped>
.gradient-text {
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  font-weight: 700;
  display: inline-block;
  animation: gradientShift 3s ease infinite;
  
  &.primary {
    background-image: linear-gradient(45deg, #667eea, #764ba2, #667eea);
  }
  
  &.secondary {
    background-image: linear-gradient(45deg, #f093fb, #f5576c, #f093fb);
  }
  
  &.success {
    background-image: linear-gradient(45deg, #4facfe, #00f2fe, #4facfe);
  }
  
  &.warning {
    background-image: linear-gradient(45deg, #fa709a, #fee140, #fa709a);
  }
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>