<template>
  <div class="buttons">
    <NuxtLink class="button" to="https://t.me/kiruhak11">
      <IconTg />
      <span>Telegram</span>
    </NuxtLink>
    <NuxtLink class="button button-gh" to="https://github.com/kiruhak11">
      <IconGitHub />
      <span>GitHub</span>
    </NuxtLink>
    <NuxtLink class="button" to="https://vk.com/kiruhak11">
      <IconVk />
      <span>Vk</span>
    </NuxtLink>
  </div>
</template>
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
