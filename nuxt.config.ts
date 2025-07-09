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
  googleFonts: {
    families: {
      Ubuntu: [400, 500, 600, 700],
    },
  },
  app: {
    head: {
      title: "Кирилл Коваленко - Веб-разработчик",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "Профессиональная веб-разработка, создание современных веб-приложений и сайтов. Принимаю заказы на фриланс разработку.",
        },
        {
          name: "keywords",
          content:
            "веб-разработка, фриланс, программист, создание сайтов, разработка веб-приложений",
        },
        { name: "yandex-verification", content: "44f17adb3814c2c5" },
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
