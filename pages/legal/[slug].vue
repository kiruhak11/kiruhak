<script setup lang="ts">
import {
  legalConfig,
  legalDocumentById,
  legalDocuments,
} from "../../constants/legal-config";

const route = useRoute();

const document = computed(() =>
  legalDocumentById(String(route.params.slug || ""))
);

if (!document.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Legal document not found",
  });
}

useSeoMeta({
  title: () => document.value?.title || "Юридическая информация",
  description: () => document.value?.summary || "Юридическая информация K-Studio",
  robots: "index, follow",
});

useHead({
  link: [
    {
      rel: "canonical",
      href: () =>
        `${legalConfig.contacts.siteUrl}/legal/${document.value?.id || "details"}`,
    },
  ],
});
</script>

<template>
  <main v-if="document" class="legal-document">
    <div class="document-shell">
      <nav class="document-back" aria-label="Навигация по документам">
        <NuxtLink to="/legal">← Юридический центр</NuxtLink>
        <span aria-hidden="true">/</span>
        <span>{{ document.shortTitle }}</span>
      </nav>

      <div class="document-layout">
        <aside class="document-sidebar" aria-label="Другие документы">
          <span>ДОКУМЕНТЫ</span>
          <NuxtLink
            v-for="item in legalDocuments"
            :key="item.id"
            :to="`/legal/${item.id}`"
            :aria-current="item.id === document.id ? 'page' : undefined"
          >
            {{ item.shortTitle }}
          </NuxtLink>
        </aside>

        <article class="document-content">
          <header class="document-header">
            <p class="document-kicker">K-STUDIO / ПРАВОВАЯ ИНФОРМАЦИЯ</p>
            <div class="document-title-row">
              <h1>{{ document.title }}</h1>
            </div>
            <p class="document-summary">{{ document.summary }}</p>
            <div class="document-meta">
              <span>Версия {{ document.version }}</span>
              <span>{{ document.effectiveDate }}</span>
            </div>
          </header>

          <nav class="contents" aria-label="Содержание документа">
            <span>В этом документе</span>
            <a
              v-for="(section, index) in document.sections"
              :key="section.title"
              :href="`#section-${index + 1}`"
            >
              {{ section.title }}
            </a>
          </nav>

          <section
            v-for="(section, index) in document.sections"
            :id="`section-${index + 1}`"
            :key="section.title"
            class="document-section"
          >
            <h2>{{ section.title }}</h2>
            <p v-for="(paragraph, pIndex) in section.paragraphs || []" :key="pIndex">
              {{ paragraph }}
            </p>
            <ul v-if="section.bullets && section.bullets.length">
              <li v-for="(bullet, bIndex) in section.bullets" :key="bIndex">
                {{ bullet }}
              </li>
            </ul>
          </section>

          <footer class="document-footer">
            <p>
              Оператор: {{ legalConfig.operator.fullName }} · ИНН
              {{ legalConfig.operator.inn }}
            </p>
            <p>
              Юридические обращения:
              <a :href="`mailto:${legalConfig.contacts.legalEmail}`">{{
                legalConfig.contacts.legalEmail
              }}</a>
            </p>
            <p>
              Версия {{ document.version }} · действует с
              {{ document.effectiveDate }}
            </p>
          </footer>
        </article>
      </div>
    </div>
  </main>

  <main v-else class="not-found">
    <div>
      <h1>Документ не найден</h1>
      <p>
        Запрошенный юридический документ отсутствует.
        <NuxtLink to="/legal">Вернуться в юридический центр</NuxtLink>
      </p>
    </div>
  </main>
</template>

<style scoped lang="scss">
:root{--background-color:#f4f6f2;--background-color-hover:#edf1eb;--background-color-secondary:#e9eee8;--airpods-store-color:#41674b;--background-color-links:#47544a;--border-color:#d7ded7;--color-text:#1b241e;--color-text-secondary:#47544a;--color-text-muted:#637067;--color-text-hover:#263a2c;--color-accent:#41674b;--color-accent-hover:#33543c;--box-shadow-color:rgba(21,41,27,.1);--box-shadow-color-hover:rgba(21,41,27,.16);--background-info-color:#e9eee8;--gradient-primary:linear-gradient(135deg,#41674b,#587960);--gradient-secondary:linear-gradient(135deg,#6e876e,#879782);--gradient-success:linear-gradient(135deg,#28744a,#4b9265);--gradient-warning:linear-gradient(135deg,#b87936,#d39a50);--success-color:#28744a;--error-color:#a83f36;--warning-color:#9a642a;--info-color:#41674b;--modal-backdrop:rgba(0,0,0,.5);--card-shadow:0 4px 6px rgba(0,0,0,.07);--card-shadow-hover:0 10px 25px rgba(0,0,0,.1);--input-border:#c4cec4;--input-focus:#6d9874;--input-background:#fff;--particle-overlay-color:hsla(0,0%,100%,.05);--footer-surface:hsla(0,0%,100%,.82);--footer-glow-1:rgba(79,172,254,.16);--footer-glow-2:rgba(250,112,154,.2);--footer-pill-bg:rgba(248,250,252,.9)}
.dark{--background-color:#0b100e;--background-color-hover:#141c16;--background-color-secondary:#19231c;--airpods-store-color:#b9d9a7;--background-color-links:#c0ccc2;--border-color:#2a382e;--color-text:#f0f4ef;--color-text-secondary:#c0ccc2;--color-text-muted:#9aa89c;--color-text-hover:#f5faf4;--color-accent:#b9d9a7;--color-accent-hover:#c9e6b9;--box-shadow-color:rgba(0,0,0,.24);--box-shadow-color-hover:rgba(0,0,0,.34);--background-info-color:#19231c;--gradient-primary:linear-gradient(135deg,#71916f,#9fbd8f);--gradient-secondary:linear-gradient(135deg,#637964,#859c7e);--gradient-success:linear-gradient(135deg,#43845a,#6ca67c);--gradient-warning:linear-gradient(135deg,#a87037,#cb9752);--success-color:#8dcc9d;--error-color:#f09c91;--warning-color:#e2b36d;--info-color:#b9d9a7;--modal-backdrop:rgba(1,4,9,.8);--card-shadow:0 4px 6px rgba(1,4,9,.3);--card-shadow-hover:0 10px 25px rgba(1,4,9,.4);--input-border:#35443a;--input-focus:#91b982;--input-background:#0d1117;--particle-overlay-color:rgba(7,10,14,.2);--footer-surface:rgba(13,17,23,.78);--footer-glow-1:rgba(88,166,255,.2);--footer-glow-2:rgba(121,192,255,.14);--footer-pill-bg:rgba(22,27,34,.92)}
.legal-document{background:var(--portfolio-bg);color:var(--portfolio-text);min-height:70vh;padding:clamp(1.5rem,4vw,3rem) 0 6rem}
.document-shell{margin:0 auto;width:min(1120px,100% - 2 * var(--portfolio-gutter))}
.document-back{align-items:center;color:var(--portfolio-text-muted);display:flex;flex-wrap:wrap;font-size:.85rem;gap:.6rem;min-height:44px}
.document-back a,.document-footer a{color:var(--portfolio-accent);text-underline-offset:3px}
.contents a:focus-visible,.document-back a:focus-visible,.document-footer a:focus-visible,.document-sidebar a:focus-visible{outline:2px solid var(--portfolio-accent);outline-offset:3px}
.document-layout{align-items:start;display:grid;gap:clamp(1.5rem,5vw,4rem);grid-template-columns:215px minmax(0,760px);justify-content:space-between;margin-top:1.5rem}
.document-sidebar{display:grid;gap:.25rem;padding:.6rem 0;position:sticky;top:1rem}
.contents>span,.document-kicker,.document-sidebar>span{color:var(--portfolio-text-muted);font:600 .68rem/1.5 var(--portfolio-font-mono);letter-spacing:.08em}
.document-sidebar>span{padding:.3rem .7rem .55rem}
.document-sidebar a{align-items:center;border-radius:var(--portfolio-radius-sm);color:var(--portfolio-text-secondary);display:flex;font-size:.9rem;line-height:1.35;min-height:42px;padding:.5rem .7rem;text-decoration:none}
.document-sidebar a:hover,.document-sidebar a[aria-current=page]{background:var(--portfolio-bg-elevated);color:var(--portfolio-text)}
.document-sidebar a[aria-current=page]{box-shadow:inset 2px 0 var(--portfolio-accent)}
.document-content{min-width:0}
.document-header{border-bottom:1px solid var(--portfolio-border);padding-bottom:1.75rem}
.document-kicker{margin:0 0 .8rem}
.document-title-row{align-items:flex-start;display:flex;gap:1rem;justify-content:space-between}
h1{font-size:clamp(2rem,4.5vw,3.5rem);letter-spacing:-.05em;line-height:1.08;margin:0}
.draft-badge{border:1px solid var(--portfolio-border);border-radius:var(--portfolio-radius-pill);color:var(--portfolio-text-muted);flex:0 0 auto;font-size:.72rem;padding:.42rem .65rem}
.document-summary{color:var(--portfolio-text-secondary);font-size:1.04rem;line-height:1.65;margin:1rem 0;max-width:640px}
.document-meta{color:var(--portfolio-text-muted);display:flex;flex-wrap:wrap;font:.68rem/1.5 var(--portfolio-font-mono);gap:.6rem 1.1rem}
.draft-callout{align-items:start;background:var(--portfolio-bg-elevated);border:1px solid var(--portfolio-border);border-radius:var(--portfolio-radius-sm);color:var(--portfolio-text-secondary);display:grid;gap:.75rem;grid-template-columns:.55rem minmax(0,1fr);line-height:1.55;margin:1.5rem 0;padding:1rem 1.1rem}
.draft-callout-mark{background:var(--portfolio-accent);border-radius:50%;height:.5rem;margin-top:.45rem;width:.5rem}
.draft-callout>div{display:grid;gap:.3rem}
.draft-callout strong{color:var(--portfolio-text)}
.contents{background:var(--portfolio-bg-elevated);border:1px solid var(--portfolio-border);border-radius:var(--portfolio-radius-md);display:grid;gap:.55rem;margin:2rem 0 2.5rem;padding:1rem 1.1rem}
.contents a{color:var(--portfolio-text-secondary);text-decoration:none;text-underline-offset:3px}
.contents a:hover{color:var(--portfolio-accent);text-decoration:underline}
.document-section{margin:2.5rem 0;scroll-margin-top:1.5rem}
.document-section h2{font-size:clamp(1.25rem,2.4vw,1.55rem);letter-spacing:-.025em;line-height:1.3;margin:0 0 .85rem}
.document-section li,.document-section p{color:var(--portfolio-text-secondary);font-size:1rem;line-height:1.78;overflow-wrap:anywhere}
.document-section p{margin:.75rem 0}
.document-section ul{display:grid;gap:.75rem;padding-left:1.25rem}
.document-section li::marker{color:var(--portfolio-accent)}
.document-footer{border-top:1px solid var(--portfolio-border);color:var(--portfolio-text-muted);font-size:.82rem;line-height:1.6;margin-top:3rem;padding-top:1.2rem}
.not-found{background:var(--portfolio-bg);color:var(--portfolio-text);display:grid;min-height:60vh;place-items:center}
.not-found a{color:var(--portfolio-accent)}
@media (max-width: 780px){.document-layout[data-v-0437b42c]{gap:.75rem;grid-template-columns:1fr}.document-sidebar[data-v-0437b42c]{display:flex;gap:.35rem;overflow-x:auto;padding:.25rem 0 .75rem;position:static;scrollbar-width:thin}.document-sidebar>span[data-v-0437b42c]{display:none}.document-sidebar a[data-v-0437b42c]{border:1px solid var(--portfolio-border);border-radius:var(--portfolio-radius-pill);flex:0 0 auto;font-size:.78rem;max-width:70vw;white-space:nowrap}.document-sidebar a[aria-current=page][data-v-0437b42c]{box-shadow:inset 0 -2px var(--portfolio-accent)}.document-title-row[data-v-0437b42c]{display:block}.draft-badge[data-v-0437b42c]{display:inline-flex;margin-top:.8rem}}
@media print{.legal-document[data-v-0437b42c]{background:#fff;color:#111;padding:0}.document-back[data-v-0437b42c],.document-sidebar[data-v-0437b42c],.draft-callout[data-v-0437b42c]{display:none}.document-layout[data-v-0437b42c]{display:block}.document-section[data-v-0437b42c]{-moz-column-break-inside:avoid;break-inside:avoid}.document-section li[data-v-0437b42c],.document-section p[data-v-0437b42c]{color:#111}}
@media (prefers-reduced-motion: reduce){[data-v-0437b42c]{scroll-behavior:auto!important}}
</style>
