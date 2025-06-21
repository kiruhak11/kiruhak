<template>
  <span class="animated-counter">{{ displayValue }}</span>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  value: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    default: 2000
  },
  delay: {
    type: Number,
    default: 0
  }
})

const displayValue = ref(0)

const animate = () => {
  const startTime = Date.now()
  const startValue = 0
  const endValue = props.value
  
  const updateCounter = () => {
    const currentTime = Date.now()
    const elapsed = currentTime - startTime
    
    if (elapsed < props.duration) {
      const progress = elapsed / props.duration
      const currentValue = Math.floor(startValue + (endValue - startValue) * progress)
      displayValue.value = currentValue
      requestAnimationFrame(updateCounter)
    } else {
      displayValue.value = endValue
    }
  }
  
  setTimeout(updateCounter, props.delay)
}

onMounted(() => {
  animate()
})

watch(() => props.value, () => {
  animate()
})
</script>

<style lang="scss" scoped>
.animated-counter {
  font-weight: 700;
  color: var(--color-accent);
}
</style> 