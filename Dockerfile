# Используем поддерживаемую LTS-ветку Node.js
FROM node:22-alpine AS base

# Сборка приложения и генерация Prisma client
FROM base AS builder
WORKDIR /app
COPY . .

# Устанавливаем все зависимости (включая dev) для сборки
RUN npm ci

# Генерируем Prisma клиент
RUN npx prisma generate

# Собираем приложение
RUN npm run build

# Продакшен образ, копируем все файлы и запускаем приложение
FROM base AS runner
WORKDIR /app

ARG VCS_REF=unknown
ARG SOURCE_URL=https://github.com/kiruhak11/kiruhak
ARG IMAGE_VERSION=development
LABEL org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.source=$SOURCE_URL \
      org.opencontainers.image.title="Kiruhak Portfolio" \
      org.opencontainers.image.version=$IMAGE_VERSION

ENV NODE_ENV=production
# Создаем пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxtjs

# Копируем собранное приложение
COPY --from=builder /app/public ./public
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Создаем папку node_modules и копируем Prisma клиент
RUN mkdir -p node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Устанавливаем права доступа
RUN chown -R nuxtjs:nodejs /app

USER nuxtjs

EXPOSE 3015

ENV PORT=3015
ENV HOSTNAME=0.0.0.0

# Запускаем приложение
CMD ["node", ".output/server/index.mjs"]
