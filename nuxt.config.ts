// https://nuxt.com/docs/api/configuration/nuxt-config
const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || "https://kiruhak11.ru";
const yandexMetrikaId = process.env.YANDEX_METRIKA_ID || "";
const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowAnyOrigin = corsOrigins.includes("*");

export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: process.env.NODE_ENV !== "production" },
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
    disallow: ["/success", "/error"],
    sitemap: `${siteUrl}/sitemap.xml`,
  },
  googleFonts: {
    families: {
      Ubuntu: [400, 500, 600, 700],
    },
  },
  app: {
    head: {
      script: yandexMetrikaId
        ? [
            {
              innerHTML: ` (function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${yandexMetrikaId}', 'ym');

    ym(${yandexMetrikaId}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});`,
            },
          ]
        : [],
      noscript: yandexMetrikaId
        ? [
            {
              innerHTML: `<div><img src="https://mc.yandex.ru/watch/${yandexMetrikaId}" style="position:absolute; left:-9999px;" alt="" /></div>`,
            },
          ]
        : [],
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
    url: siteUrl,
  },
  nitro: {
    prerender: {
      routes: ["/", "/projects", "/contact"],
    },
    routeRules: {
      "/api/**": {
        cors: true,
        headers: {
          "Access-Control-Allow-Origin": allowAnyOrigin
            ? "*"
            : corsOrigins.join(", "),
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, X-Requested-With",
          "Access-Control-Allow-Credentials": allowAnyOrigin ? "false" : "true",
        },
      },
    },
  },
  runtimeConfig: {
    telegramToken: process.env.TELEGRAM_BOT_TOKEN || "",
    telegramChatId: process.env.ADMIN_TELEGRAM_ID || "",
    channelUsername: process.env.TELEGRAM_CHANNEL_USERNAME || "webmonke",
    botSecret: process.env.BOT_SECRET || "",
    allowSelfTopup: process.env.ALLOW_SELF_TOPUP === "true",
    authTokenSecret:
      process.env.AUTH_TOKEN_SECRET ||
      process.env.BOT_SECRET ||
      "dev-only-auth-token-secret",
    public: {
      siteUrl,
      channelUsername: process.env.TELEGRAM_CHANNEL_USERNAME || "webmonke",
    },
  },
  vite: {
    server: {
      allowedHosts: ["host.docker.internal", "localhost", "127.0.0.1"],
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/styles/collection/index.scss";',
        },
      },
    },
  },
});
