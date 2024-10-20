<template>
  <NuxtLayout>
    <main>
      <div class="container">
        <div class="lable"><h1>Проекты</h1></div>
        <div class="cards">
          <div class="card"><ProjectCardAPS /></div>
          <div class="card"><ProjectCardAPS /></div>
          <div class="card"><ProjectCardAPS /></div>
        </div>
      </div>
    </main>
  </NuxtLayout>
</template>

<style lang="scss" scoped>
h1 {
  padding: 16px;
  color: var(--color-text);
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

.card {
  display: flex;
  margin: 24px 12px;
  justify-content: center;
  &s {
    display: flex;
    justify-content: center;

    @media (max-width: 768px) {
      flex-direction: column;
      margin: 0;
    }
  }
}
.container {
  padding: 0 32px;
}
.lable {
  display: flex;
  justify-content: center;
  padding: 16px 16px;
}
</style>
