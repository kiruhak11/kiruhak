<template>
  <div class="gallery">
    <div
      v-for="(image, index) in images"
      :key="index"
      class="gallery-item"
      :style="{ backgroundImage: 'url(' + image + ')' }"
    ></div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const images = ref([
  "https://placehold.co/300x200?text=Image+1",
  "https://placehold.co/300x200?text=Image+2",
  "https://placehold.co/300x200?text=Image+3",
  "https://placehold.co/300x200?text=Image+4",
]);
</script>

<style lang="scss" scoped>
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  width: 100%;
  max-width: 1000px;
  padding: 16px;
}
.gallery-item {
  width: 100%;
  padding-top: 66.66%;
  background-size: cover;
  background-position: center;
  border-radius: 12px;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}
.gallery-item:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}
</style>
