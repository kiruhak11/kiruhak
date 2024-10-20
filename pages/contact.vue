<template>
  <NuxtLayout>
    <div class="container">
      <ContactCard v-if="!isMobile" />
      <ContactCardMobile v-if="isMobile" />
    </div>
  </NuxtLayout>
</template>
<script lang="ts" setup>
const { isMobile } = useDevice();
</script>
<style lang="scss" scoped>
.container {
  padding-top: 32px;
}
.links {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  padding: 16px 16px;
  border-radius: 16px;
  border: 2px solid #fff;
  box-shadow: 0 0px 16px #02c4ff;
  background-color: var(--background-color);
  &__btn {
    display: flex;
    justify-content: center;
    background-color: black;
    color: #fff;
    padding: 8px;
    margin: 0 8px;
    border-radius: 8px;
    border: 1px solid #fff;
    &:hover {
      box-shadow: 0 0px 16px #02c4ff;
    }
  }
}
</style>
