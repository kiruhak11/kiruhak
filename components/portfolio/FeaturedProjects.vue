<template>
  <section id="featured-projects" class="section featured-section" aria-labelledby="featured-title">
    <div class="container">
      <header class="section-heading">
        <div>
          <p class="eyebrow">ИЗБРАННЫЕ КЕЙСЫ</p>
          <h2 id="featured-title">Работа в реальных продуктах</h2>
        </div>
        <p class="heading-note">Контекст проекта и конкретная зона моей ответственности.</p>
      </header>

      <p v-if="loading" class="section-state" role="status">Загружаю избранные кейсы…</p>
      <p v-else-if="error" class="section-state error" role="status">{{ error }}</p>
      <p v-else-if="!items.length" class="section-state" role="status">
        Подтверждённые кейсы появятся здесь после загрузки.
      </p>

      <ol v-else class="case-list">
        <li v-for="(item, index) in items" :key="item.id" class="case-item">
          <article class="case-layout">
            <div class="case-visual" :class="{ reversed: index % 2 === 1 }">
              <div class="case-image-frame">
                <ProjectPreview
                  :src="item.image"
                  :alt="`Превью проекта «${item.title}»`"
                  img-class="case-image"
                  fallback-class="case-image-fallback"
                />
              </div>
              <span class="case-index" aria-hidden="true">0{{ index + 1 }}</span>
            </div>

            <div class="case-copy">
              <div class="case-meta">
                <span class="ownership-label">
                  {{ item.ownershipType === 'OWN' ? 'Собственный продукт' : item.ownershipType === 'CLIENT' ? 'Клиентский проект' : 'Командный проект' }}
                </span>
                <span v-if="item.company" class="case-company">{{ item.company }}</span>
              </div>
              <h3>{{ item.title }}</h3>
              <p class="case-summary">{{ item.summary }}</p>
              <p v-if="item.role" class="case-role"><span>Роль</span>{{ item.role }}</p>

              <div v-if="item.responsibilities.length" class="case-contribution">
                <h4>{{ item.ownershipType === 'CLIENT' ? 'Что я реализовал' : 'Мой вклад' }}</h4>
                <ul>
                  <li v-for="responsibility in item.responsibilities.slice(0, 3)" :key="responsibility">
                    {{ responsibility }}
                  </li>
                </ul>
              </div>

              <ul v-if="item.technologies.length" class="case-stack" aria-label="Технологии проекта">
                <li v-for="technology in item.technologies.slice(0, 5)" :key="technology">
                  {{ technology }}
                </li>
              </ul>

              <a
                v-if="item.productionUrl"
                class="case-link"
                :href="item.productionUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                Смотреть продукт
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 4.5h8v8m-.5-7.5-8 8" /></svg>
              </a>
            </div>
          </article>
        </li>
      </ol>

      <NuxtLink class="all-projects-link" to="/projects">
        Все проекты <span aria-hidden="true">↗</span>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  items: Array<{
    id: string;
    title: string;
    image: string;
    summary: string;
    ownershipType: "OWN" | "CLIENT" | "PARTICIPATION" | "UNVERIFIED";
    role: string | null;
    company: string | null;
    productionUrl?: string | null;
    responsibilities: string[];
    technologies: string[];
  }>;
  loading: boolean;
  error: string | null;
}>();
</script>

<style scoped lang="scss">
.featured-section { padding: clamp(3.75rem, 8vw, 7rem) 0; }
.container { width: min(var(--portfolio-content-width), calc(100% - 2 * var(--portfolio-gutter))); margin: 0 auto; }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 2rem; margin-bottom: clamp(2rem, 4vw, 3.5rem); }
.eyebrow { margin: 0 0 0.75rem; color: var(--portfolio-accent); font-size: var(--portfolio-label); font-weight: 700; letter-spacing: 0.12em; }
h2 { max-width: 20ch; margin: 0; color: var(--portfolio-text); font-size: var(--portfolio-h2); letter-spacing: -0.04em; line-height: 1.12; }
.heading-note { max-width: 27ch; margin: 0; color: var(--portfolio-text-secondary); line-height: 1.6; }
.section-state { padding: 1rem 0; color: var(--portfolio-text-secondary); }
.section-state.error { color: var(--portfolio-error); }
.case-list { display: grid; gap: clamp(2.5rem, 6vw, 5rem); margin: 0; padding: 0; list-style: none; }
.case-item { padding-bottom: clamp(2.5rem, 6vw, 5rem); border-bottom: 1px solid var(--portfolio-border); }
.case-layout { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr); align-items: center; gap: clamp(2rem, 6vw, 6rem); }
.case-visual { position: relative; min-width: 0; }
.case-visual.reversed { order: 2; }
.case-image-frame { overflow: hidden; aspect-ratio: 16 / 10; border: 1px solid var(--portfolio-border); border-radius: var(--portfolio-radius-lg); background: var(--portfolio-surface); }
:deep(.case-image) { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform 360ms cubic-bezier(.2,.7,.2,1); }
:deep(.case-image-fallback) { min-height: 100%; background: var(--portfolio-surface-hover); }
.case-layout:hover :deep(.case-image) { transform: scale(1.025); }
.case-index { position: absolute; right: 1rem; bottom: -1rem; color: var(--portfolio-accent); font-family: var(--portfolio-font-mono); font-size: clamp(2.5rem, 5vw, 4rem); line-height: 1; letter-spacing: -0.08em; }
.case-copy { min-width: 0; }
.case-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; color: var(--portfolio-text-muted); font-size: var(--portfolio-small); }
.ownership-label { color: var(--portfolio-accent); font-weight: 650; }
.case-company::before { content: "·"; margin-right: 0.6rem; }
h3 { margin: 0.8rem 0 0; color: var(--portfolio-text); font-size: clamp(1.65rem, 3vw, 2.35rem); line-height: 1.08; letter-spacing: -0.05em; }
.case-summary { max-width: 54ch; margin: 0.9rem 0 0; color: var(--portfolio-text-secondary); line-height: 1.65; }
.case-role { display: flex; gap: 0.75rem; margin: 1.1rem 0 0; color: var(--portfolio-text); font-size: var(--portfolio-small); }
.case-role span { color: var(--portfolio-text-muted); }
.case-contribution { margin-top: 1.25rem; }
.case-contribution h4 { margin: 0; color: var(--portfolio-text); font-size: 0.9rem; }
.case-contribution ul { display: grid; gap: 0.5rem; margin: 0.55rem 0 0; padding-left: 1.1rem; color: var(--portfolio-text-secondary); font-size: var(--portfolio-small); line-height: 1.55; }
.case-contribution li::marker { color: var(--portfolio-accent); }
.case-stack { display: flex; flex-wrap: wrap; gap: 0.4rem 0.9rem; margin: 1rem 0 0; padding: 0; list-style: none; color: var(--portfolio-text-muted); font-family: var(--portfolio-font-mono); font-size: 0.72rem; }
.case-link,.all-projects-link { display: inline-flex; align-items: center; gap: 0.55rem; color: var(--portfolio-text); font-weight: 650; text-decoration: none; text-underline-offset: 4px; }
.case-link { margin-top: 1.25rem; font-size: var(--portfolio-small); }
.case-link svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; transition: transform 160ms ease; }
.case-link:hover svg,.all-projects-link:hover span { transform: translate(2px, -2px); }
.case-link:hover,.all-projects-link:hover { color: var(--portfolio-accent); }
.all-projects-link { margin-top: 2rem; }
.all-projects-link span { transition: transform 160ms ease; }
.case-link:focus-visible,.all-projects-link:focus-visible { outline: 2px solid var(--portfolio-accent); outline-offset: 4px; border-radius: 2px; }
.featured-section { padding-block: var(--portfolio-section-space); }
:deep(.case-image) { transition-duration: var(--portfolio-motion-slow); transition-timing-function: var(--portfolio-ease-standard); }
@media (max-width: 900px) {
  .section-heading { display: block; }
  .heading-note { margin-top: 0.8rem; }
  .case-layout { grid-template-columns: minmax(0, 1fr); gap: 1.75rem; }
  .case-visual.reversed { order: initial; }
  .case-index { right: 0.75rem; bottom: -0.6rem; }
}
@media (prefers-reduced-motion: reduce) {
  :deep(.case-image),.case-link svg,.all-projects-link span { transition: none; }
  .case-layout:hover :deep(.case-image) { transform: none; }
}
</style>
