<template>
  <NuxtLayout>
    <main>
      <div class="container">
        <!-- Hero Section -->
        <div class="hero-section">
          <Typewriter text="Привет, я Кирилл!" :speed="100" :delay="500" />
          <p class="hero-subtitle">
            Front-end разработчик, создающий современные и красивые
            веб-приложения
          </p>
          <div class="hero-buttons">
            <button class="hero-button primary" @click="setModal(OrderModal)">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Заказать сайт
            </button>
            <button
              class="hero-button secondary"
              @click="setModal(DonationModal)"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  fill="currentColor"
                />
              </svg>
              Поддержать проект
            </button>
          </div>
        </div>

        <!-- Discount Wheel Section -->
        <div class="discount-section">
          <h2 class="section-title">Испытайте удачу!</h2>
          <p class="section-description">
            Крутите колесо и получите скидку на разработку сайта
          </p>
          <DiscountWheel @spin-complete="handleSpinComplete" />
        </div>

        <!-- About Me Section -->
        <AboutMe
          @openOrderModal="setModal(OrderModal)"
          @openDonationModal="setModal(DonationModal)"
        />

        <!-- Centered Stats Section -->
        <div class="stats-container">
          <StatsSection />
        </div>

        <!-- Interactive Components -->
        <div class="interactive-section">
          <FocusChecker />
        </div>

        <div class="interactive-section">
          <InteractiveGallery />
        </div>

        <div class="interactive-section">
          <ParallaxSection />
        </div>

        <div class="interactive-section">
          <PhysicalBox />
        </div>

        <!-- Floating Cards -->
        <FloatingCards />

        <!-- Modals -->
        <DiscountContactModal
          :show="showDiscountModal"
          :discount="currentDiscount"
          @close="showDiscountModal = false"
          @submit="handleDiscountSubmit"
        />
      </div>
    </main>
  </NuxtLayout>
</template>

<script setup>
import { ref } from "vue";
import Typewriter from "~/components/Typewriter.vue";
import AboutMe from "~/components/AboutMe.vue";
import StatsSection from "~/components/StatsSection.vue";
import FloatingCards from "~/components/FloatingCards.vue";
import FocusChecker from "~/components/FocusChecker.vue";
import InteractiveGallery from "~/components/InteractiveGallery.vue";
import ParallaxSection from "~/components/ParallaxSection.vue";
import PhysicalBox from "~/components/PhysicalBox.vue";
import OrderModal from "~/components/OrderModal.vue";
import DonationModal from "~/components/DonationModal.vue";
import DiscountWheel from "~/components/DiscountWheel.vue";
import DiscountContactModal from "~/components/DiscountContactModal.vue";

const { setModal } = useFrogModal();
const showDiscountModal = ref(false);
const currentDiscount = ref(0);

const handleSpinComplete = (discount) => {
  currentDiscount.value = discount;
  showDiscountModal.value = true;
};

const handleDiscountSubmit = () => {
  showDiscountModal.value = false;
  // Можно добавить уведомление об успешной отправке
};
</script>

<style lang="scss" scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
}

.hero-section {
  text-align: center;
  padding: 80px 0 60px;

  .hero-subtitle {
    font-size: 1.3rem;
    color: var(--color-text-secondary);
    margin: 24px 0 40px 0;
    line-height: 1.6;
    animation: fadeInUp 0.8s ease forwards 0.6s;
    opacity: 0;
  }
}

.discount-section {
  text-align: center;
  padding: 40px 0;
  margin: 40px 0;
  background: var(--background-secondary);
  border-radius: 20px;

  .section-title {
    font-size: 2rem;
    margin-bottom: 1rem;
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .section-description {
    color: var(--color-text-secondary);
    margin-bottom: 2rem;
  }
}

.hero-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
  animation: fadeInUp 0.8s ease forwards 0.8s;
  opacity: 0;
}

.hero-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 28px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;

  &.primary {
    background: var(--gradient-primary);
    color: white;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }
  }

  &.secondary {
    background: var(--background-color);
    color: var(--color-text);
    border: 2px solid var(--border-color);

    &:hover {
      border-color: #ef4444;
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(239, 68, 68, 0.2);
    }
  }
}

.stats-container {
  display: flex;
  justify-content: center;
  margin: 60px 0;
}

.interactive-section {
  margin: 60px 0;

  &:first-of-type {
    margin-top: 40px;
  }

  &:last-of-type {
    margin-bottom: 40px;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }

  .hero-section {
    padding: 60px 0 40px;

    .hero-subtitle {
      font-size: 1.1rem;
      margin: 20px 0 30px 0;
    }
  }

  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }

  .hero-button {
    width: 100%;
    max-width: 300px;
    justify-content: center;
  }

  .stats-container {
    margin: 40px 0;
  }

  .interactive-section {
    margin: 40px 0;
  }

  .discount-section {
    margin: 20px 0;
    padding: 30px 16px;

    .section-title {
      font-size: 1.5rem;
    }
  }
}
</style>
