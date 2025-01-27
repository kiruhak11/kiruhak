<template>
  <div class="card">
    <NuxtLink to="https://devhorizon.kiruhak11.ru" class="content">
      <IconBook />
      <div class="description">
        <p class="title">
          <strong>DevHorizon</strong>
        </p>
        <p class="info">Start in 01.10.2024</p>
        <p class="price">Finished</p>
      </div>
    </NuxtLink>
  </div>
</template>

<style lang="scss" scoped>
.title {
  color: var(--color-text);
}
.card {
  width: 200px;
  height: 280px;
  overflow: visible;
  cursor: pointer;
  position: relative;
  opacity: 0;
  transform: scale(0.9);
  animation: fadeIn 0.7s ease forwards;
  animation-delay: 0.3s;
  transition: background-color 0.3s, box-shadow 0.3s;

  &:hover {
    box-shadow: 0 12px 24px var(--box-shadow-color-hover);
  }
}

@keyframes fadeIn {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.card::before,
.content {
  border-radius: 5px;
  box-shadow: 0 0px 16px var(--box-shadow-color);
  transition: transform 300ms, box-shadow 200ms;
}

.card::before {
  position: absolute;
  content: " ";
  display: block;
  width: 100%;
  height: 100%;
  background-color: var(--airpods-store-color);
  transform: rotateZ(5deg);
}

.description {
  width: 100%;
  text-align: center;
  margin-top: 20px;
}

.info {
  color: var(--color-text-hover);
}

.price {
  font-weight: bold;
  color: #2bff00;
}

.description p {
  margin-bottom: 10px;
}

.card .content {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: var(--background-color);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: rotateZ(-5deg);
}

.content .img {
  width: 150px;
  height: fit-content;
}

.card:hover::before,
.card:hover .content {
  transform: rotateZ(0deg);
}

.card:active::before,
.card:active .content {
  box-shadow: none;
}
path {
  fill: var(--color-text);
}
</style>
