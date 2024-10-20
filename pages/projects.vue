<template>
  <NuxtLayout>
    <main>
      <div class="container">
        <div class="lable">Проекты</div>
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
.card {
  margin: 0 24px;
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
