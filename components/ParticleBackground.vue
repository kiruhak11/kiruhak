<template>
  <div class="particle-background">
    <canvas ref="canvas" class="particle-canvas"></canvas>
    <div class="blur-overlay"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvas = ref(null)
let animationId = null
let particles = []
let ctx = null

class Particle {
  constructor(x, y, canvas) {
    this.x = x
    this.y = y
    this.canvas = canvas
    this.size = Math.random() * 2 + 1
    this.speedX = Math.random() * 2 - 1
    this.speedY = Math.random() * 2 - 1
    this.opacity = Math.random() * 0.5 + 0.2
    this.color = `rgba(102, 126, 234, ${this.opacity})`
  }

  update() {
    this.x += this.speedX
    this.y += this.speedY

    if (this.x > this.canvas.width || this.x < 0) {
      this.speedX = -this.speedX
    }
    if (this.y > this.canvas.height || this.y < 0) {
      this.speedY = -this.speedY
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

const initParticles = () => {
  if (!canvas.value) return
  
  ctx = canvas.value.getContext('2d')
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight
  
  particles = []
  const particleCount = Math.min(50, Math.floor((canvas.value.width * canvas.value.height) / 20000))
  
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle(
      Math.random() * canvas.value.width,
      Math.random() * canvas.value.height,
      canvas.value
    ))
  }
}

const animate = () => {
  if (!ctx || !canvas.value) return
  
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  
  particles.forEach(particle => {
    particle.update()
    particle.draw(ctx)
  })
  
  // Рисуем соединения между частицами
  particles.forEach((particle, index) => {
    for (let j = index + 1; j < particles.length; j++) {
      const dx = particle.x - particles[j].x
      const dy = particle.y - particles[j].y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < 100) {
        ctx.strokeStyle = `rgba(102, 126, 234, ${0.1 * (1 - distance / 100)})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(particle.x, particle.y)
        ctx.lineTo(particles[j].x, particles[j].y)
        ctx.stroke()
      }
    }
  })
  
  animationId = requestAnimationFrame(animate)
}

const handleResize = () => {
  if (canvas.value) {
    canvas.value.width = window.innerWidth
    canvas.value.height = window.innerHeight
    initParticles()
  }
}

onMounted(() => {
  initParticles()
  animate()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.particle-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
}

.particle-canvas {
  display: block;
  width: 100%;
  height: 100%;
  filter: blur(1px);
}

.blur-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
</style> 