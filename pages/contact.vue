<template>
  <NuxtLayout>
    <div class="contact-page">
      <!-- Если устройство не мобильное, показываем десктопную версию -->
      <ContactCard v-if="!isMobile" />
      <!-- Иначе – мобильную версию -->
      <ContactCardMobile v-else />
    </div>
  </NuxtLayout>
</template>

<script lang="ts" setup>
const { isMobile } = useDevice();
</script>

<style lang="scss" scoped>
.contact-page {
  padding-top: 64px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--background-color);
}
</style>
