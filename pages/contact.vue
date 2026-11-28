<template>
  <NuxtLayout>
    <main id="main-content" class="contact-page" tabindex="-1">
      <div class="contact-shell">
        <header class="contact-intro">
          <h1>Связаться со мной</h1>
          <p>Помогу разобраться с задачей или обсудить работу в команде.</p>
        </header>

        <div class="contact-paths">
          <section class="contact-path" aria-labelledby="client-title">
            <h2 id="client-title">Заказчикам</h2>
            <p>Расскажите, что хотите запустить или улучшить.</p>
            <a class="contact-action primary" href="#contact-form" @click="goToForm()">Обсудить проект</a>
          </section>

          <section id="employers" class="contact-path" aria-labelledby="employer-title">
            <h2 id="employer-title" tabindex="-1">Работодателям</h2>
            <p>Пришлите описание роли и расскажите о команде.</p>
            <div class="contact-actions">
              <a class="contact-action secondary" :href="publicContact.email.href">Написать на почту</a>
              <button class="text-action" type="button" @click="goToForm(true)">Написать через форму</button>
            </div>
            <div class="contact-actions">
              <NuxtLink class="text-action" to="/projects?type=participation">Командные проекты</NuxtLink>
              <a class="text-action" :href="publicContact.github.href" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </section>
        </div>

        <section id="contact-form" class="contact-form-section" aria-labelledby="contact-form-title">
          <div class="contact-form-intro">
            <h2 id="contact-form-title" tabindex="-1">Написать мне</h2>
            <p>Оставьте удобный контакт для ответа.</p>
            <a class="text-action" :href="publicContact.telegram.href" target="_blank" rel="noopener noreferrer">Написать в Telegram</a>
          </div>

          <PortfolioLeadContactForm
            id-prefix="contact-lead"
            :topic="topicRequest.text"
            :topic-id="topicRequest.id"
            :task-hint="taskHint"
            @topic-applied="onTopicApplied"
            @topic-detached="onTopicDetached"
          />
        </section>
      </div>
    </main>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import { publicContact } from "~/constants/public-contact";

useSeoMeta({
  title: "Контакты — Кирилл Коваленко",
  description: "Написать Кириллу Коваленко по поводу работы в команде, сотрудничества или разработки продукта: форма заявки, Telegram и email.",
  ogTitle: "Контакты — Кирилл Коваленко",
  ogDescription: "Написать по поводу работы в команде, сотрудничества или разработки продукта.",
  ogType: "website",
  ogUrl: new URL("/contact", useRuntimeConfig().public.siteUrl).href,
  twitterCard: "summary",
  twitterTitle: "Контакты — Кирилл Коваленко",
  twitterDescription: "Связаться по поводу работы, сотрудничества или разработки продукта.",
  robots: "index, follow",
});
useHead({ link: [{ rel: "canonical", href: new URL("/contact", useRuntimeConfig().public.siteUrl).href }] });

const route = useRoute();
const topicRequest = ref({ id: "", text: "" });
const taskHint = ref("Расскажите о задаче и желаемых сроках");

const goToForm = async (employment = false) => {
  topicRequest.value = employment
    ? { id: "team", text: "Вакансия или работа в команде" }
    : { id: "", text: "" };
  if (!employment) onTopicDetached();
  await nextTick();
  document.getElementById("contact-form-title")?.focus();
};

const onTopicApplied = (id: string) => {
  taskHint.value = id === "team" ? "Опишите роль и расскажите о команде" : "Расскажите о задаче и желаемых сроках";
};

const onTopicDetached = () => {
  onTopicApplied("");
};

onMounted(async () => {
  await nextTick();
  const target = route.hash === "#contact-form" ? "contact-form-title" : route.hash === "#employers" ? "employer-title" : "";
  if (target) document.getElementById(target)?.focus();
});
</script>

<style scoped lang="scss">
.contact-page {
  min-height: 62vh;
  padding: clamp(2rem, 6vw, 4.5rem) 0 var(--portfolio-section-space);
  background: var(--portfolio-bg);
  color: var(--portfolio-text);
  font-family: var(--portfolio-font-sans);
}

.contact-shell {
  width: min(1050px, calc(100% - 2 * var(--portfolio-gutter)));
  margin-inline: auto;
}

.contact-intro { margin-bottom: clamp(1.4rem, 5vw, 2.5rem); }
h1 { margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.1; letter-spacing: -0.05em; }
h2 { margin: 0; font-size: clamp(1.4rem, 3vw, 1.85rem); line-height: 1.18; letter-spacing: -0.035em; }
p { margin: .6rem 0 0; font-size: 1rem; color: var(--portfolio-text-secondary); line-height: 1.55; }
.contact-intro p { font-size: var(--portfolio-body-large); }

.contact-paths { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(.8rem, 3vw, 1.25rem); }
.contact-path { padding: clamp(1rem, 3vw, 1.5rem); border: 1px solid var(--portfolio-border); border-radius: var(--portfolio-radius-lg); background: var(--portfolio-bg-elevated); }
.contact-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .25rem 1rem; }
.contact-path > .contact-action,.contact-actions:first-of-type { margin-top: .7rem; }
.contact-action,.text-action { display: inline-flex; min-height: var(--portfolio-control-compact); align-items: center; color: var(--portfolio-text); font: inherit; font-size: .9rem; font-weight: 650; }
.contact-action { padding-inline: .85rem; border: 1px solid var(--portfolio-control-border); border-radius: var(--portfolio-radius-sm); text-decoration: none; }
.contact-action.primary { border-color: var(--portfolio-accent); background: var(--portfolio-accent); color: var(--portfolio-accent-contrast); }
.contact-action.primary:hover { background: var(--portfolio-accent-hover); }
.contact-action.secondary:hover { background: var(--portfolio-surface-hover); }
.text-action { padding: 0; border: 0; background: transparent; text-decoration: underline; text-underline-offset: .2em; cursor: pointer; }
.text-action:hover { color: var(--portfolio-accent); }
.contact-action:focus-visible,.text-action:focus-visible,h2[tabindex]:focus-visible { outline: 2px solid var(--portfolio-accent); outline-offset: 3px; }

.contact-form-section { display: grid; grid-template-columns: minmax(0, .7fr) minmax(0, 1.3fr); gap: clamp(1rem, 5vw, 4rem); margin-top: clamp(1.75rem, 5vw, 3rem); padding-top: clamp(1.35rem, 4vw, 2.5rem); border-top: 1px solid var(--portfolio-border); }
.contact-form-section,.contact-path,h2[tabindex] { scroll-margin-top: 6rem; }
.contact-form-intro .text-action { margin-top: .4rem; }

@media (max-width: 700px) {
  .contact-paths,.contact-form-section { grid-template-columns: minmax(0, 1fr); }
}
</style>
