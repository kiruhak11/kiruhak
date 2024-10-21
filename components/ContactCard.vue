<template>
  <div class="container">
    <NuxtLink
      data-text="Github"
      to="https://github.com/kiruhak11"
      style="--r: -15"
      class="glass"
    >
      <IconGitHub />
    </NuxtLink>
    <NuxtLink
      data-text="Telegram"
      to="https://t.me/kiruhak11"
      style="--r: 5"
      class="glass"
    >
      <IconTg />
    </NuxtLink>
    <NuxtLink
      data-text="Vk"
      to="https://vk.com/kiruhak11"
      style="--r: 25"
      class="glass"
    >
      <IconVk />
    </NuxtLink>
  </div>
</template>

<style lang="scss" scoped>
/* From Uiverse.io by codebykay101 */
.container {
  position: relative;
  display: flex;
  width: auto;
  justify-content: center;
  align-items: center;

  opacity: 0;
  transform: scale(0.9);
  animation: fadeIn 0.7s ease forwards;
  animation-delay: 0.3s;
  transition: background-color 0.3s, box-shadow 0.3s;
}
@keyframes fadeIn {
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.container .glass {
  position: relative;
  width: 180px;
  height: 200px;
  background: linear-gradient(var(--color-text), transparent);
  box-shadow: 0 25px 25px rgba(0, 0, 0, 0.25);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: 0.5s;
  border-radius: 10px;
  margin: 0 -45px;
  backdrop-filter: blur(10px);
  transform: rotate(calc(var(--r) * 1deg));
}

.container:hover .glass {
  transform: rotate(0deg);
  margin: 0 10px;
}

.container .glass::before {
  content: attr(data-text);
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 40px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--color-text);
}
.container .glass svg {
  font-size: 2.5em;
  fill: var(--color-text);
}
</style>
