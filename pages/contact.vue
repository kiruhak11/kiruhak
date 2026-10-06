<template>
  <NuxtLayout>
    <main class="contact-page">
      <div class="contact-shell">
        <header class="contact-intro">
          <p class="eyebrow">КОНТАКТЫ / КИРИЛЛ КОВАЛЕНКО</p>
          <h1>Давайте обсудим задачу</h1>
          <p class="intro-copy">
            Можно написать по поводу работы в команде, сотрудничества или разработки продукта — отвечаю лично.
          </p>
        </header>

        <div class="contact-layout">
          <section class="contact-channels" aria-label="Способы связи">
            <a
              class="primary-channel"
              :href="publicContact.telegram.href"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Написать Кириллу в Telegram, откроется в новой вкладке"
            >
              <span class="channel-eyebrow">ПРЕДПОЧТИТЕЛЬНЫЙ КАНАЛ</span>
              <span class="channel-title">Telegram</span>
              <span class="channel-label">{{ publicContact.telegram.label }}</span>
              <span class="channel-action">Написать в Telegram <span aria-hidden="true">↗</span></span>
              <svg class="channel-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m21 3-7.2 18-3.8-7-7-3.8L21 3Z" />
                <path d="M10 14 21 3" />
              </svg>
            </a>

            <div class="secondary-channels">
              <a class="secondary-channel" :href="publicContact.email.href">
                <span class="channel-icon-wrap" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
                </span>
                <span class="secondary-copy">
                  <span class="secondary-title">Email</span>
                  <span class="secondary-value">{{ publicContact.email.label }}</span>
                </span>
                <span class="secondary-action">Написать <span aria-hidden="true">↗</span></span>
              </a>

              <a
                class="secondary-channel"
                :href="publicContact.github.href"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="`Открыть GitHub ${publicContact.github.label} в новой вкладке`"
              >
                <span class="channel-icon-wrap" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3-.3 6.1-1.5 6.1-6.6A5.1 5.1 0 0 0 18.8 5a4.7 4.7 0 0 0-.1-3S17.5 1.7 15 3.4a13.3 13.3 0 0 0-7 0C5.5 1.7 4.3 2 4.3 2A4.7 4.7 0 0 0 4.2 5a5.1 5.1 0 0 0-1.4 3.9c0 5.1 3.1 6.3 6.1 6.6a3.4 3.4 0 0 0-.9 2.6V22" /></svg>
                </span>
                <span class="secondary-copy">
                  <span class="secondary-title">GitHub</span>
                  <span class="secondary-value">{{ publicContact.github.label }}</span>
                </span>
                <span class="secondary-action">Открыть профиль <span aria-hidden="true">↗</span></span>
              </a>
            </div>
          </section>

          <aside class="contact-context" aria-labelledby="contact-context-title">
            <p class="eyebrow">О ЧЁМ МОЖНО НАПИСАТЬ</p>
            <h2 id="contact-context-title">Короткого первого сообщения достаточно</h2>
            <ul class="topic-list">
              <li>Вакансия или работа в команде</li>
              <li>Сайт, сервис или приложение</li>
              <li>Техническое сотрудничество</li>
            </ul>
            <p class="message-hint">
              Для проекта опишите задачу, желаемый результат и ориентир по срокам — этого хватит, чтобы начать разговор.
            </p>
            <NuxtLink class="form-link" to="/#application-form">
              Или подробно описать проект <span aria-hidden="true">→</span>
            </NuxtLink>
          </aside>
        </div>
      </div>
    </main>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { publicContact } from "~/constants/public-contact";

useSeoMeta({
  title: "Контакты — Кирилл Коваленко",
  description: "Написать Кириллу Коваленко по поводу работы в команде, сотрудничества или разработки продукта: Telegram и email.",
});
</script>

<style scoped lang="scss">
.contact-page {
  min-height: 62vh;
  padding: clamp(3.25rem, 8vw, 7rem) 0 clamp(4rem, 9vw, 8rem);
  background: var(--portfolio-bg);
  color: var(--portfolio-text);
  font-family: var(--portfolio-font-sans);
}

.contact-shell {
  width: min(1050px, calc(100% - 2 * var(--portfolio-gutter)));
  margin: 0 auto;
}

.contact-intro { max-width: 720px; margin-bottom: clamp(2rem, 5vw, 3.5rem); }
.eyebrow { margin: 0 0 0.85rem; color: var(--portfolio-accent); font-size: var(--portfolio-label); font-weight: 700; letter-spacing: 0.12em; }
h1 { margin: 0; color: var(--portfolio-text); font-size: clamp(2.1rem, 4vw, 3.5rem); line-height: 1.04; letter-spacing: -0.06em; }
.intro-copy { max-width: 56ch; margin: 1rem 0 0; color: var(--portfolio-text-secondary); font-size: var(--portfolio-body-large); line-height: 1.65; }
.contact-layout { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr); gap: clamp(2rem, 7vw, 6rem); align-items: start; }
.contact-channels { display: grid; min-width: 0; gap: 0.85rem; }
.primary-channel { position: relative; display: grid; min-height: 210px; align-content: start; justify-items: start; overflow: hidden; padding: clamp(1.25rem, 4vw, 2rem); border: 1px solid var(--portfolio-border-hover); border-radius: var(--portfolio-radius-lg); background: var(--portfolio-surface); color: var(--portfolio-text); text-decoration: none; box-shadow: var(--portfolio-shadow-soft); transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease, box-shadow 160ms ease; }
.primary-channel:hover { transform: translateY(-2px); border-color: var(--portfolio-accent); background: var(--portfolio-bg-elevated); box-shadow: var(--portfolio-shadow); }
.channel-eyebrow { color: var(--portfolio-accent); font-family: var(--portfolio-font-mono); font-size: 0.68rem; font-weight: 650; letter-spacing: 0.09em; }
.channel-title { margin-top: 0.85rem; font-size: clamp(1.75rem, 3.2vw, 2.4rem); font-weight: 650; letter-spacing: -0.05em; line-height: 1.1; }
.channel-label { margin-top: 0.35rem; color: var(--portfolio-text-secondary); font-size: 0.9rem; }
.channel-action { display: inline-flex; min-height: 42px; align-items: center; gap: 0.65rem; margin-top: 1.2rem; padding: 0 0.85rem; border-radius: var(--portfolio-radius-sm); background: var(--portfolio-accent); color: var(--portfolio-accent-contrast); font-size: 0.82rem; font-weight: 650; }
.channel-icon { position: absolute; top: 1.5rem; right: 1.5rem; width: clamp(36px, 5vw, 54px); height: clamp(36px, 5vw, 54px); fill: none; stroke: var(--portfolio-accent); stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.25; }
.secondary-channels { display: grid; gap: 0.65rem; }
.secondary-channel { display: flex; min-width: 0; min-height: 76px; align-items: center; gap: 0.85rem; padding: 0.8rem 0.9rem; border: 1px solid var(--portfolio-border); border-radius: var(--portfolio-radius-md); background: var(--portfolio-bg-elevated); color: var(--portfolio-text); text-decoration: none; transition: border-color 150ms ease, background-color 150ms ease; }
.secondary-channel:hover { border-color: var(--portfolio-border-hover); background: var(--portfolio-surface-hover); }
.channel-icon-wrap { display: grid; width: 38px; height: 38px; flex: 0 0 38px; place-items: center; border: 1px solid var(--portfolio-border); border-radius: var(--portfolio-radius-sm); color: var(--portfolio-accent); }
.channel-icon-wrap svg { width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }
.secondary-copy { display: grid; min-width: 0; gap: 0.18rem; }
.secondary-title { font-size: 0.85rem; font-weight: 650; }
.secondary-value { overflow-wrap: anywhere; color: var(--portfolio-text-muted); font-size: 0.77rem; }
.secondary-action { display: inline-flex; flex: 0 0 auto; align-items: center; gap: 0.3rem; margin-left: auto; color: var(--portfolio-text-secondary); font-size: 0.72rem; font-weight: 600; white-space: nowrap; }
.contact-context { padding-top: 0.3rem; }
.contact-context h2 { max-width: 24ch; margin: 0; color: var(--portfolio-text); font-size: clamp(1.3rem, 2vw, 1.65rem); line-height: 1.2; letter-spacing: -0.035em; }
.topic-list { display: grid; gap: 0.65rem; margin: 1.25rem 0 0; padding: 0; color: var(--portfolio-text-secondary); font-size: 0.88rem; line-height: 1.5; list-style: none; }
.topic-list li { display: flex; gap: 0.6rem; }
.topic-list li::before { color: var(--portfolio-accent); content: "↗"; }
.message-hint { margin: 1.25rem 0 0; padding-top: 1rem; border-top: 1px solid var(--portfolio-border); color: var(--portfolio-text-muted); font-size: 0.82rem; line-height: 1.6; }
.form-link { display: inline-flex; min-height: 44px; align-items: center; gap: 0.45rem; margin-top: 0.8rem; color: var(--portfolio-text); font-size: 0.82rem; font-weight: 650; text-underline-offset: 4px; }
.form-link:hover { color: var(--portfolio-accent); }
.primary-channel:focus-visible,.secondary-channel:focus-visible,.form-link:focus-visible { outline: 2px solid var(--portfolio-accent); outline-offset: 3px; }

@media (max-width: 760px) {
  .contact-page { padding-top: clamp(1.75rem, 6vw, 2.5rem); }
  .contact-intro { margin-bottom: 1.5rem; }
  .contact-layout { grid-template-columns: 1fr; gap: 2.25rem; }
  .contact-context { padding-top: 1.25rem; border-top: 1px solid var(--portfolio-border); }
  .contact-context h2 { max-width: 32ch; }
}

@media (max-width: 420px) {
  h1 { font-size: clamp(2rem, 8vw, 2.35rem); }
  .intro-copy { margin-top: 0.75rem; font-size: 0.98rem; }
  .secondary-channel { gap: 0.6rem; padding-inline: 0.7rem; }
  .secondary-action { font-size: 0.68rem; }
}

@media (prefers-reduced-motion: reduce) {
  .primary-channel,.secondary-channel { transition: none; }
  .primary-channel:hover { transform: none; }
}
</style>
