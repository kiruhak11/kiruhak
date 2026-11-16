<script setup lang="ts">
import { legalConfig, legalDocuments } from "../../constants/legal-config";

useSeoMeta({
  title: "Юридическая информация",
  description:
    "Политика обработки персональных данных K-Studio и контакты оператора.",
  robots: "index, follow",
});

useHead({
  link: [{ rel: "canonical", href: `${legalConfig.contacts.siteUrl}/legal` }],
});
</script>

<template>
  <NuxtLayout>
    <main class="legal-hub">
      <div class="legal-container">
        <p class="legal-kicker">K-STUDIO / ДОКУМЕНТЫ</p>
        <h1>Юридическая информация</h1>
        <p class="legal-intro">
          Актуальная политика обработки персональных данных K-Studio и способы
          обратиться к оператору.
        </p>

        <div class="legal-layout">
          <nav class="legal-index" aria-label="Содержание юридического центра">
            <span class="legal-index-label">Разделы</span>
            <a v-for="doc in legalDocuments" :key="doc.id" :href="`#${doc.id}`">
              {{ doc.shortTitle }}
            </a>
          </nav>

          <section class="legal-cards" aria-label="Документы K-Studio">
            <article
              v-for="doc in legalDocuments"
              :id="doc.id"
              :key="doc.id"
              class="legal-card"
            >
              <div class="card-meta">
                <span>{{ doc.version }}</span>
                <span>{{ doc.effectiveDate }}</span>
              </div>
              <h2>
                <NuxtLink :to="`/legal/${doc.id}`">
                  {{ doc.title }} <span aria-hidden="true">↗</span>
                </NuxtLink>
              </h2>
              <p>{{ doc.summary }}</p>
              <NuxtLink class="card-link" :to="`/legal/${doc.id}`">
                Открыть документ <span aria-hidden="true">→</span>
              </NuxtLink>
            </article>
          </section>
        </div>
      </div>
    </main>
  </NuxtLayout>
</template>

<style scoped lang="scss">
:root{--background-color:#f4f6f2;--background-color-hover:#edf1eb;--background-color-secondary:#e9eee8;--airpods-store-color:#41674b;--background-color-links:#47544a;--border-color:#d7ded7;--color-text:#1b241e;--color-text-secondary:#47544a;--color-text-muted:#637067;--color-text-hover:#263a2c;--color-accent:#41674b;--color-accent-hover:#33543c;--box-shadow-color:rgba(21,41,27,.1);--box-shadow-color-hover:rgba(21,41,27,.16);--background-info-color:#e9eee8;--gradient-primary:linear-gradient(135deg,#41674b,#587960);--gradient-secondary:linear-gradient(135deg,#6e876e,#879782);--gradient-success:linear-gradient(135deg,#28744a,#4b9265);--gradient-warning:linear-gradient(135deg,#b87936,#d39a50);--success-color:#28744a;--error-color:#a83f36;--warning-color:#9a642a;--info-color:#41674b;--modal-backdrop:rgba(0,0,0,.5);--card-shadow:0 4px 6px rgba(0,0,0,.07);--card-shadow-hover:0 10px 25px rgba(0,0,0,.1);--input-border:#c4cec4;--input-focus:#6d9874;--input-background:#fff;--particle-overlay-color:hsla(0,0%,100%,.05);--footer-surface:hsla(0,0%,100%,.82);--footer-glow-1:rgba(79,172,254,.16);--footer-glow-2:rgba(250,112,154,.2);--footer-pill-bg:rgba(248,250,252,.9)}.dark{--background-color:#0b100e;--background-color-hover:#141c16;--background-color-secondary:#19231c;--airpods-store-color:#b9d9a7;--background-color-links:#c0ccc2;--border-color:#2a382e;--color-text:#f0f4ef;--color-text-secondary:#c0ccc2;--color-text-muted:#9aa89c;--color-text-hover:#f5faf4;--color-accent:#b9d9a7;--color-accent-hover:#c9e6b9;--box-shadow-color:rgba(0,0,0,.24);--box-shadow-color-hover:rgba(0,0,0,.34);--background-info-color:#19231c;--gradient-primary:linear-gradient(135deg,#71916f,#9fbd8f);--gradient-secondary:linear-gradient(135deg,#637964,#859c7e);--gradient-success:linear-gradient(135deg,#43845a,#6ca67c);--gradient-warning:linear-gradient(135deg,#a87037,#cb9752);--success-color:#8dcc9d;--error-color:#f09c91;--warning-color:#e2b36d;--info-color:#b9d9a7;--modal-backdrop:rgba(1,4,9,.8);--card-shadow:0 4px 6px rgba(1,4,9,.3);--card-shadow-hover:0 10px 25px rgba(1,4,9,.4);--input-border:#35443a;--input-focus:#91b982;--input-background:#0d1117;--particle-overlay-color:rgba(7,10,14,.2);--footer-surface:rgba(13,17,23,.78);--footer-glow-1:rgba(88,166,255,.2);--footer-glow-2:rgba(121,192,255,.14);--footer-pill-bg:rgba(22,27,34,.92)}.legal-hub{background:var(--portfolio-bg);color:var(--portfolio-text);min-height:70vh;padding:clamp(3rem,7vw,6rem) 0 5rem}.legal-container{margin:0 auto;width:min(1120px,100% - 2 * var(--portfolio-gutter))}.card-meta,.legal-index-label,.legal-kicker{color:var(--portfolio-text-muted);font:600 .72rem/1.4 var(--portfolio-font-mono);letter-spacing:.08em;text-transform:uppercase}h1{font-size:clamp(2.3rem,5vw,4.1rem);letter-spacing:-.055em;line-height:1.03;margin:.75rem 0 1rem}.legal-intro{font-size:clamp(1rem,1.7vw,1.18rem);line-height:1.7;margin:0;max-width:650px}.draft-notice,.legal-intro{color:var(--portfolio-text-secondary)}.draft-notice{align-items:flex-start;background:var(--portfolio-bg-elevated);border:1px solid var(--portfolio-border);border-radius:var(--portfolio-radius-md);display:flex;gap:.75rem;line-height:1.55;margin:1.75rem 0 3rem;max-width:780px;padding:1rem 1.15rem}.draft-dot{background:var(--portfolio-accent);border-radius:50%;flex:0 0 auto;height:.55rem;margin-top:.38rem;width:.55rem}.draft-notice strong{color:var(--portfolio-text)}.legal-layout{align-items:start;display:grid;gap:clamp(1.5rem,4vw,3.5rem);grid-template-columns:210px minmax(0,1fr)}.legal-index{display:grid;gap:.2rem;padding:1rem 0;position:sticky;top:1.5rem}.legal-index-label{padding:0 .7rem .5rem}.legal-index a{align-items:center;border-radius:var(--portfolio-radius-sm);color:var(--portfolio-text-secondary);display:flex;min-height:42px;padding:.5rem .7rem;text-decoration:none;transition:background var(--portfolio-motion-fast),color var(--portfolio-motion-fast)}.legal-index a:focus-visible,.legal-index a:hover{background:var(--portfolio-bg-elevated);color:var(--portfolio-text)}.card-link:focus-visible,.legal-card h2 a:focus-visible,.legal-index a:focus-visible{outline:2px solid var(--portfolio-accent);outline-offset:3px}.legal-cards{display:grid;gap:.9rem}.legal-card{background:var(--portfolio-bg-elevated);border:1px solid var(--portfolio-border);border-radius:var(--portfolio-radius-lg);box-shadow:var(--portfolio-shadow-soft);padding:clamp(1.2rem,3vw,1.75rem)}.legal-card h2{font-size:clamp(1.25rem,2.5vw,1.75rem);letter-spacing:-.035em;margin:.8rem 0 .5rem}.legal-card h2 a{color:inherit;text-decoration:none}.legal-card h2 a span{color:var(--portfolio-accent);font-size:.8em}.legal-card p{color:var(--portfolio-text-secondary);line-height:1.65;margin:0;max-width:680px}.card-meta{display:flex;flex-wrap:wrap;font-size:.64rem;gap:.6rem;justify-content:space-between;letter-spacing:.04em}.card-link{align-items:center;color:var(--portfolio-accent);display:inline-flex;font-weight:650;gap:.5rem;margin-top:.8rem;min-height:44px;text-decoration:none}.card-link:hover{color:var(--portfolio-accent-hover)}.legal-card--operator{border-color:var(--portfolio-border-hover)}@media(max-width:760px){.legal-layout{gap:1.2rem;grid-template-columns:1fr}.legal-index{display:flex;gap:.25rem;overflow-x:auto;padding:.3rem 0 .5rem;position:static;scrollbar-width:thin}.legal-index-label{display:none}.legal-index a{border:1px solid var(--portfolio-border);border-radius:var(--portfolio-radius-pill);flex:0 0 auto;font-size:.82rem;min-height:40px;white-space:nowrap}}@media print{.legal-hub{background:#fff;color:#000;padding:0}.draft-notice,.legal-index{display:none}.legal-layout{display:block}.legal-card{-moz-column-break-inside:avoid;box-shadow:none;break-inside:avoid}}@media(prefers-reduced-motion:reduce){.legal-index a{transition:none}}

</style>
