<template>
  <div class="buttons">
    <a class="button" :href="publicContact.telegram.href" target="_blank" rel="noopener noreferrer">
      <IconTg />
      <span>Telegram</span>
    </a>
    <a class="button button-gh" :href="publicContact.github.href" target="_blank" rel="noopener noreferrer">
      <IconGitHub />
      <span>GitHub</span>
    </a>
    <a class="button" :href="publicContact.vk.href" target="_blank" rel="noopener noreferrer">
      <IconVk />
      <span>Vk</span>
    </a>
  </div>
</template>
<script setup lang="ts">
import { publicContact } from "~/constants/public-contact";
</script>
<style lang="scss" scoped>
.button {
  background: transparent;
  position: relative;
  padding: 5px 15px;
  display: flex;
  margin: 6px 12px;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid var(--color-text);
  border-radius: 25px;
  outline: none;
  overflow: hidden;
  color: var(--color-text);
  transition: color 0.3s 0.1s ease-out;
  text-align: center;
  svg {
    fill: var(--color-text);
  }
  span {
    margin: 10px;
  }
  &s {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}
</style>
