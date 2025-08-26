# Используем официальный Node.js образ
FROM node:18-alpine AS base

# Устанавливаем зависимости только при необходимости
FROM base AS deps
# Проверяем https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine для понимания, почему libc6-compat
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Пересобираем зависимости для продакшена
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Генерируем Prisma клиент
RUN npx prisma generate

# Собираем приложение
RUN npm run build

# Продакшен образ, копируем все файлы и запускаем приложение
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Создаем пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxtjs

# Копируем собранное приложение
COPY --from=builder /app/public ./public
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Устанавливаем права доступа
RUN chown -R nuxtjs:nodejs /app

USER nuxtjs

EXPOSE 3015

ENV PORT 3015
ENV HOSTNAME "0.0.0.0"

# Запускаем приложение
CMD ["node", ".output/server/index.mjs"]
