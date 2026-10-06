<template>
  <section id="services" class="section services-section" aria-labelledby="services-title">
    <div class="container">
      <header class="services-heading">
        <div><p class="eyebrow">КОММЕРЧЕСКАЯ РАЗРАБОТКА</p><h2 id="services-title">Форматы задач</h2></div>
        <p>Стоимость — ориентир для типового объёма. После обсуждения зафиксируем состав работ и итоговую оценку.</p>
      </header>

      <ol class="service-list">
        <li v-for="(pack, index) in packages" :key="pack.name" class="service-row">
          <span class="service-number">0{{ index + 1 }}</span>
          <div class="service-main">
            <h3>{{ pack.name }}</h3>
            <p>{{ pack.description }}</p>
            <ul><li v-for="feature in pack.features" :key="feature">{{ feature }}</li></ul>
          </div>
          <div class="service-estimate"><strong>{{ pack.price }}</strong><span>{{ pack.timeline }}</span></div>
          <button type="button" class="service-cta" @click="$emit('choose')">Обсудить <span aria-hidden="true">↗</span></button>
        </li>
      </ol>
      <p class="support-note"><strong>После запуска</strong> — могу подключиться к исправлениям, развитию продукта и выпуску проверенных изменений.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  packages: Array<{
    name: string;
    price: string;
    timeline: string;
    description: string;
    features: string[];
  }>;
}>();

defineEmits<{ choose: [] }>();
</script>

<style scoped lang="scss">
.services-section { padding: clamp(3.5rem, 7vw, 6rem) 0; border-top: 1px solid var(--portfolio-border); background: var(--portfolio-surface); }
.container { width: min(var(--portfolio-content-width), calc(100% - 2 * var(--portfolio-gutter))); margin: 0 auto; }
.services-heading { display: flex; justify-content: space-between; align-items: end; gap: 2rem; margin-bottom: 1.5rem; }
.eyebrow { margin: 0 0 0.7rem; color: var(--portfolio-accent); font-size: var(--portfolio-label); font-weight: 700; letter-spacing: 0.12em; }
h2 { margin: 0; color: var(--portfolio-text); font-size: var(--portfolio-h2); letter-spacing: -0.04em; }
.services-heading > p { max-width: 46ch; margin: 0; color: var(--portfolio-text-secondary); line-height: 1.6; }
.service-list { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--portfolio-border); }
.service-row { display: grid; grid-template-columns: 42px minmax(0, 1fr) minmax(135px, auto) auto; align-items: start; gap: 1rem; padding: 1.45rem 0; border-bottom: 1px solid var(--portfolio-border); }
.service-number { padding-top: 0.12rem; color: var(--portfolio-accent); font-family: var(--portfolio-font-mono); font-size: 0.75rem; }
.service-main { min-width: 0; }
h3 { margin: 0; color: var(--portfolio-text); font-size: 1.1rem; }
.service-main > p { margin: 0.45rem 0 0; color: var(--portfolio-text-secondary); line-height: 1.55; }
.service-main ul { display: flex; flex-wrap: wrap; gap: 0.35rem 1.2rem; margin: 0.7rem 0 0; padding: 0; list-style: none; color: var(--portfolio-text-muted); font-size: 0.8rem; }
.service-main li::before { content: "— "; color: var(--portfolio-accent); }
.service-estimate { display: grid; gap: 0.3rem; color: var(--portfolio-text); white-space: nowrap; }
.service-estimate strong { font-size: 0.95rem; }
.service-estimate span { color: var(--portfolio-text-muted); font-size: 0.8rem; }
.service-cta { display: inline-flex; align-items: center; gap: 0.4rem; min-height: 44px; padding: 0 0.75rem; border: 1px solid var(--portfolio-border); border-radius: var(--portfolio-radius-sm); background: transparent; color: var(--portfolio-text); font: inherit; font-size: 0.82rem; font-weight: 650; cursor: pointer; transition: border-color 160ms ease, color 160ms ease, background-color 160ms ease; }
.service-cta:hover { border-color: var(--portfolio-border-hover); background: var(--portfolio-surface-hover); color: var(--portfolio-accent); }
.service-cta:focus-visible { outline: 2px solid var(--portfolio-accent); outline-offset: 3px; }
.support-note { margin: 1.25rem 0 0; color: var(--portfolio-text-secondary); font-size: var(--portfolio-small); line-height: 1.6; }
.support-note strong { color: var(--portfolio-text); }
@media (max-width: 760px) { .services-heading { display: block; } .services-heading > p { margin-top: 0.75rem; } .service-row { grid-template-columns: 28px minmax(0, 1fr); gap: 0.7rem 0.9rem; } .service-number { grid-row: span 2; } .service-estimate { grid-column: 2; display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.35rem 0.8rem; } .service-cta { grid-column: 2; justify-self: start; } }
@media (prefers-reduced-motion: reduce) { .service-cta { transition: none; } }
</style>
