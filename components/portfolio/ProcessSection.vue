<template>
  <section id="approach" class="section process-section" aria-labelledby="process-title">
    <div class="container">
      <header class="process-heading">
        <p class="eyebrow">ПОДХОД К РАЗРАБОТКЕ</p>
        <h2 id="process-title">От понимания задачи до проверенного запуска</h2>
        <p>Схема полного цикла из первого экрана здесь раскрывается в конкретные рабочие шаги.</p>
      </header>
      <ol class="process-list">
        <li v-for="(step, index) in steps" :key="step.title" class="process-step">
          <span class="step-number">0{{ index + 1 }}</span>
          <div><h3>{{ step.title }}</h3><p>{{ step.description }}</p></div>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ steps: Array<{ title: string; description: string }> }>();
</script>

<style scoped lang="scss">
.process-section { padding: clamp(4rem, 8vw, 7rem) 0; }
.process-section { padding-block: var(--portfolio-section-space); }
.container { width: min(var(--portfolio-content-width), calc(100% - 2 * var(--portfolio-gutter))); margin: 0 auto; }
.process-heading { max-width: 640px; }
.eyebrow { margin: 0 0 0.75rem; color: var(--portfolio-accent); font-size: var(--portfolio-label); font-weight: 700; letter-spacing: 0.12em; }
h2 { max-width: 19ch; margin: 0; color: var(--portfolio-text); font-size: var(--portfolio-h2); line-height: 1.12; letter-spacing: -0.04em; }
.process-heading > p:last-child { max-width: 56ch; margin: 0.9rem 0 0; color: var(--portfolio-text-secondary); line-height: 1.65; }
.process-list { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: clamp(2rem, 4vw, 3.5rem) 0 0; padding: 0; list-style: none; border-top: 1px solid var(--portfolio-border); }
.process-step { position: relative; display: grid; align-content: start; gap: 1.3rem; padding: 1.35rem 1.4rem 0 0; }
.process-step:not(:last-child)::after { position: absolute; top: -1px; right: 0.6rem; width: 1px; height: 100%; background: var(--portfolio-border); content: ""; }
.step-number { color: var(--portfolio-accent); font-family: var(--portfolio-font-mono); font-size: 0.78rem; }
h3 { margin: 0; color: var(--portfolio-text); font-size: 1.05rem; letter-spacing: -0.02em; }
.process-step p { max-width: 31ch; margin: 0.55rem 0 0; color: var(--portfolio-text-secondary); font-size: var(--portfolio-small); line-height: 1.6; }
@media (max-width: 900px) { .process-list { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 1.4rem; } .process-step:nth-child(2)::after { display: none; } }
@media (max-width: 560px) { .process-list { grid-template-columns: 1fr; row-gap: 0; } .process-step { grid-template-columns: 36px minmax(0, 1fr); gap: 0.4rem; padding: 1.15rem 0; border-bottom: 1px solid var(--portfolio-border); } .process-step::after { display: none; } }
</style>
