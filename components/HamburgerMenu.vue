<template>
  <div class="container">
    <!-- Гамбургер меню -->
    <div class="hamburger-menu" @click="toggleMenu">
      <div class="hamburger-menu-text">
        <h1>Portfolio</h1>
      </div>
      <div class="hamburger-menu-icon">
        <div class="bar" :class="{ open: isOpen }"></div>
        <div class="bar" :class="{ open: isOpen }"></div>
        <div class="bar" :class="{ open: isOpen }"></div>
      </div>
    </div>

    <!-- Мобильное меню -->
    <nav :class="{ 'mobile-nav-open': isOpen }" class="mobile-nav">
      <ul>
        <div class="container">
          <div class="line"></div>
          <div class="logo">
            <div class="logo__text">
              <NuxtLink to="/">
                <h1>
                  Kovakenko Kirill: <br />
                  Front-end developer
                </h1>
              </NuxtLink>
            </div>
          </div>
          <div class="line"></div>
          <li>
            <NuxtLink to="/projects">Каталог</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/contact">Мои контакты</NuxtLink>
          </li>
          <li>
            <Switcher />
          </li>
        </div>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from "vue";

const isOpen = ref(false);

const toggleMenu = () => {
  isOpen.value = !isOpen.value;
};

watch(isOpen, () => {
  if (isOpen.value) {
    document.body.classList.add("no-scroll");
  } else {
    document.body.classList.remove("no-scroll");
  }
});

onBeforeUnmount(() => {
  document.body.classList.remove("no-scroll");
});
</script>
<style lang="scss" scoped>
.hamburger-menu {
  display: flex;
  flex-direction: row;
  &-icon {
    display: flex;
    flex-direction: column;
    margin-left: auto;
    cursor: pointer;
    z-index: 3;
  }
  .bar {
    width: 26px;
    height: 3px;
    background-color: var(--color-text);
    margin: 4px;
    transition: all 0.3s ease;
  }

  .bar.open:nth-child(1) {
    transform: rotate(45deg) translate(15px);
    width: 30px;
  }

  .bar.open:nth-child(2) {
    opacity: 0;
  }

  .bar.open:nth-child(3) {
    transform: rotate(-45deg) translate(15px);
    width: 30px;
  }
}

.mobile {
  &-nav {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transform: translateY(-20px);
    transition: max-height 0.5s ease, opacity 0.5s ease, transform 0.5s ease;
    &-open {
      max-height: 500px;
      opacity: 1;
      transform: translateY(0);
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    li {
      margin: 16px 0;
      font-size: 32px;
    }
  }
}

/* Дополнительные стили для блокировки скролла */
.no-scroll {
  overflow: hidden;
}

.logo {
  display: flex;
  align-items: center;

  h1 {
    color: var(--color-text);
    transition: color 0.3s;
  }
}

.line {
  display: flex;
  height: 1px;
  margin: 10px 0;
  width: 100vw;
  background-color: var(--color-text);
}
</style>
