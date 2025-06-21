<template>
  <div>
    <FrogModal />
    <nuxt-page />
  </div>
</template>
<script setup lang="ts">
useSeoMeta({
  titleTemplate: (title) =>
    title ? `${title} | kiruhak` : "kiruhak - Frontend Developer",
});
</script>

<style lang="scss" src="~/assets/styles/index.scss"></style>
