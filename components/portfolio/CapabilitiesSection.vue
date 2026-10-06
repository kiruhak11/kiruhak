<template>
  <section class="section capabilities-section" aria-labelledby="capabilities-title">
    <div class="container capabilities-layout">
      <header>
        <p class="eyebrow">КОМПЕТЕНЦИИ</p>
        <h2 id="capabilities-title">Технологии — по задачам, не по списку</h2>
        <p class="intro">Показываю только инструменты, которые подтверждены избранными кейсами.</p>
      </header>
      <div class="capability-groups">
        <section v-for="group in groups" :key="group.title" class="capability-group">
          <h3>{{ group.title }}</h3>
          <ul>
            <li v-for="tool in group.tools" :key="tool">{{ tool }}</li>
          </ul>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ groups: Array<{ title: string; tools: string[] }> }>();
</script>

<style scoped lang="scss">
.capabilities-section { padding: clamp(3rem, 6vw, 5rem) 0; border-top: 1px solid var(--portfolio-border); border-bottom: 1px solid var(--portfolio-border); background: var(--portfolio-surface); }
.capabilities-section { padding-block: var(--portfolio-section-space); }
.container { width: min(var(--portfolio-content-width), calc(100% - 2 * var(--portfolio-gutter))); margin: 0 auto; }
.capabilities-layout { display: grid; grid-template-columns: minmax(220px, 0.8fr) minmax(0, 1.2fr); gap: clamp(2rem, 7vw, 7rem); align-items: start; }
.eyebrow { margin: 0 0 0.75rem; color: var(--portfolio-accent); font-size: var(--portfolio-label); font-weight: 700; letter-spacing: 0.12em; }
h2 { max-width: 14ch; margin: 0; color: var(--portfolio-text); font-size: var(--portfolio-h2); line-height: 1.12; letter-spacing: -0.04em; }
.intro { max-width: 34ch; margin: 1rem 0 0; color: var(--portfolio-text-secondary); line-height: 1.6; }
.capability-groups { display: grid; }
.capability-group { display: grid; grid-template-columns: minmax(130px, 0.7fr) minmax(0, 1.3fr); gap: 1rem; padding: 1.2rem 0; border-bottom: 1px solid var(--portfolio-border); }
.capability-group:first-child { padding-top: 0; }
.capability-group h3 { margin: 0; color: var(--portfolio-text); font-size: 0.94rem; }
.capability-group ul { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; margin: 0; padding: 0; list-style: none; color: var(--portfolio-text-secondary); font-size: var(--portfolio-small); }
@media (max-width: 760px) { .capabilities-layout { grid-template-columns: 1fr; gap: 1.75rem; } .capability-group { grid-template-columns: 1fr; gap: 0.65rem; } }
</style>
