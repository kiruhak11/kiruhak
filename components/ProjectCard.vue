<template>
  <div class="project-card" @click="$emit('openModal', project)">
    <div class="card-image">
      <img :src="project.image" :alt="project.title" />
      <div class="image-overlay">
        <div class="overlay-content">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 3H21V9"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M9 21H3V15"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M21 3L13.5 10.5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M3 21L10.5 13.5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="overlay-text">Подробнее</span>
        </div>
      </div>
      <div v-if="project.featured" class="featured-badge">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          />
        </svg>
        Избранный
      </div>
      <div class="card-category">
        {{ project.category }}
      </div>
    </div>

    <div class="card-content">
      <div class="card-header">
        <h3 class="project-title">
          <GradientText variant="primary">{{ project.title }}</GradientText>
        </h3>
      </div>

      <p class="project-description">{{ project.description }}</p>

      <div class="project-tech">
        <span
          v-for="tech in project.technologies.slice(0, 4)"
          :key="tech"
          class="tech-tag"
        >
          {{ tech }}
        </span>
        <span v-if="project.technologies.length > 4" class="tech-tag more">
          +{{ project.technologies.length - 4 }}
        </span>
      </div>

      <div class="project-meta">
        <div v-if="project.client" class="meta-item">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <circle
              cx="12"
              cy="7"
              r="4"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>{{ project.client }}</span>
        </div>
        <div v-if="project.duration" class="meta-item">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="2"
            />
            <polyline
              points="12,6 12,12 16,14"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>{{ project.duration }}</span>
        </div>
      </div>

      <div class="card-actions">
        <button
          class="action-button primary"
          @click.stop="$emit('visitProject', project)"
          v-if="project.liveUrl"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <polyline
              points="15,3 21,3 21,9"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <line
              x1="10"
              y1="14"
              x2="21"
              y2="3"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Посетить
        </button>
        <button class="action-button secondary" v-else>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <polyline
              points="15,3 21,3 21,9"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <line
              x1="10"
              y1="14"
              x2="21"
              y2="3"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Недоступен
        </button>
        <button
          class="action-button secondary"
          @click.stop="$emit('openModal', project)"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="11"
              cy="11"
              r="8"
              stroke="currentColor"
              stroke-width="2"
            />
            <path
              d="M21 21L16.65 16.65"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Подробнее
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import GradientText from "./GradientText.vue";

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
});

defineEmits(["openModal", "visitProject"]);
</script>

<style lang="scss" scoped>
.project-card {
  background: var(--background-color);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--card-shadow);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: 1px solid var(--border-color);
  position: relative;

  &:hover {
    transform: translateY(-12px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    border-color: var(--color-primary);

    .image-overlay {
      opacity: 1;
    }

    .card-image img {
      transform: scale(1.1);
    }

    .card-category {
      background: var(--gradient-primary);
      color: white;
    }
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--gradient-primary);
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }

  &:hover::before {
    transform: scaleX(1);
  }
}

.card-image {
  position: relative;
  height: 220px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.9) 0%,
    rgba(118, 75, 162, 0.9) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.4s ease;

  .overlay-content {
    color: white;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .overlay-text {
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.featured-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--gradient-primary);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.card-category {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 2;
  transition: all 0.3s ease;
}

.card-content {
  padding: 24px;
}

.card-header {
  margin-bottom: 16px;
}

.project-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
}

.project-description {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.tech-tag {
  padding: 6px 12px;
  background: var(--background-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: var(--color-accent);
    color: white;
    transform: translateY(-1px);
  }

  &.more {
    background: var(--color-accent);
    color: white;
    border-color: var(--color-accent);
  }
}

.project-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--background-color-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);

  svg {
    color: var(--color-accent);
  }
}

.card-actions {
  display: flex;
  gap: 12px;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  text-decoration: none;

  &.primary {
    background: var(--gradient-primary);
    color: white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }
  }

  &.secondary {
    background: var(--background-color-secondary);
    color: var(--color-text);
    border: 1px solid var(--border-color);

    &:hover {
      background: var(--color-accent);
      color: white;
      border-color: var(--color-accent);
      transform: translateY(-2px);
    }
  }
}

@media (max-width: 768px) {
  .card-content {
    padding: 20px;
  }

  .project-title {
    font-size: 1.2rem;
  }

  .card-actions {
    flex-direction: column;
  }

  .action-button {
    justify-content: center;
  }

  .project-meta {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
