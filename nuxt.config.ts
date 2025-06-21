// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },
  modules: ["@nuxtjs/device", "@nuxtjs/google-fonts", "rubillex_frog-modal"],
  googleFonts: {
    families: {
      Ubuntu: [400, 500, 600, 700],
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
