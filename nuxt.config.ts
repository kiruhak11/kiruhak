// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },
  modules: [
    "@nuxtjs/device",
    "@nuxtjs/google-fonts",
    "rubillex_frog-modal",
    "@nuxtjs/sitemap",
    "@nuxtjs/robots",
  ],
  sitemap: {
    strictNuxtContentPaths: false,
    sitemaps: true,
    defaults: {
      changefreq: "weekly",
      priority: 0.7,
    },
  },
  robots: {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/success", "/error"] },
    ],
    sitemap: "https://kiruhak11.ru/sitemap.xml",
    host: "https://kiruhak11.ru",
  },
  googleFonts: {
    families: {
      Ubuntu: [400, 500, 600, 700],
    },
  },
  app: {
    head: {
      script: [
        {
          innerHTML: ` (function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=103812891', 'ym');

    ym(103812891, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});
    console.log('Yandex Metrika initialized');`,
        },
      ],
      noscript: [
        {
          innerHTML: `<div><img src="https://mc.yandex.ru/watch/103812891" style="position:absolute; left:-9999px;" alt="" /></div>`,
        },
      ],
      title: "K-Studio — Веб‑разработка под ключ",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "K-Studio — корпоративная веб‑разработка под ключ. Проектирование, разработка и поддержка сайтов и веб‑сервисов. Vue/Nuxt, SEO, интеграции, CRM.",
        },
        {
          name: "keywords",
          content:
            "веб-разработка, корпоративные сайты, разработка под ключ, Vue, Nuxt, SEO, интеграции, CRM",
        },
        { name: "yandex-verification", content: "44f17adb3814c2c5" },
        {
          property: "og:title",
          content: "K-Studio — Веб‑разработка под ключ",
        },
        {
          property: "og:description",
          content:
            "Корпоративные сайты, интернет‑проекты и веб‑приложения. Экспертиза во Vue/Nuxt, интеграции, SEO.",
        },
        { property: "og:type", content: "website" },
      ],
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
  },
  site: {
    url: "https://kiruhak11.ru",
  },
  nitro: {
    prerender: {
      routes: ["/", "/projects", "/contact"],
    },
    cors: {
      origin: "*",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    },
  },
  runtimeConfig: {
    telegramToken: "6122558496:AAEXwnP3E4uIk5sSSNzD-13vQK6A4ybCBFI",
    telegramChatId: "502773482",
    channelUsername: "web_kiruhak11",
    public: {
      // Публичные переменные, если нужны
    },
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/styles/collection/index.scss";',
        },
      },
    },
  },
});
