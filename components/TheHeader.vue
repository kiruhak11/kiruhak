<template>
  <header class="header container">
    <div class="logo">
      <LoaderIcon />
      <div class="logo__text">
        <nuxt-link to="/">
          <h1>Kiruhak: Front-end developer</h1>
        </nuxt-link>
      </div>
    </div>

    <nav>
      <ul>
        <li><nuxt-link to="/projects">Каталог проектов</nuxt-link></li>
        <li><nuxt-link to="/contact">Мои контакты</nuxt-link></li>
      </ul>
    </nav>
    <Switcher />
  </header>
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 10; /* Повышенный z-index для перекрытия содержимого */
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  border-radius: 0 0 16px 16px;
  background-color: var(--background-color);
  backdrop-filter: blur(
    10px
  ); /* Эффект размытия фона для более профессионального вида */
  color: var(--color-text);
  box-shadow: 0 8px 16px rgba(0, 174, 255, 0.3); /* Мягкая тень с прозрачностью */
  transition: background-color 0.3s, box-shadow 0.3s;

  &:hover {
    background-color: var(--background-color-hover);
    box-shadow: 0 12px 24px rgba(0, 174, 255, 0.5); /* Увеличенная тень при наведении */
  }
}

.logo {
  display: flex;
  align-items: center;
  padding: 0 16px;

  &__text {
    padding-left: 16px;

    h1 {
      font-size: 1.8rem; /* Увеличен размер заголовка */
      font-weight: bold;
      color: var(--color-text);
      text-transform: uppercase; /* Добавлен верхний регистр для большей выразительности */
      letter-spacing: 1.5px; /* Легкое увеличение межбуквенного расстояния */
      transition: color 0.3s;
    }

    h1:hover {
      color: var(--color-text-hover); /* Эффект наведения на текст логотипа */
    }
  }
}

nav {
  ul {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    align-items: center;
  }

  li {
    margin: 0 16px;
    position: relative;

    /* Подчеркивание активной ссылки */
    &:hover::after,
    &.active::after {
      content: "";
      position: absolute;
      width: 100%;
      height: 2px;
      background-color: var(--color-accent);
      bottom: -4px;
      left: 0;
      transition: width 0.3s ease;
    }

    &::after {
      width: 0;
    }
  }

  a {
    color: var(--color-text);
    font-weight: bold;
    text-decoration: none;
    font-size: 1rem;
    text-transform: uppercase; /* Добавлено для большей выразительности */
    transition: color 0.3s, letter-spacing 0.3s;

    &:hover {
      color: var(
        --color-text-hover
      ); /* Плавное изменение цвета при наведении */
      letter-spacing: 1px; /* Легкое увеличение межбуквенного расстояния при наведении */
    }
  }
}
</style>
