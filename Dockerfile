# K-STUDIO production image.
# Layer layout deliberately mirrors the currently running materials-privacy-20261109
# image (kiruhak-app:materials-privacy-20261109) so the runtime artifact stays
# byte-for-byte equivalent in structure: same base, same COPY order, same user.
FROM node:22-alpine AS base

FROM base AS builder
WORKDIR /app
COPY . .

# Зависимости ставятся без NODE_ENV=production: иначе npm пропустит
# devDependencies (@nuxtjs/google-fonts, prisma, tsx, eslint), и сборка
# не запустится.
RUN npm ci
RUN npx prisma generate

# NODE_ENV=production обязателен именно на этапе сборки: бандлер подставляет
# process.env.NODE_ENV в код, и без этого флага проверки авторизации
# (например, секрета служебного API бота) могли бы быть скомпилированы
# вовсе. Защита не должна зависеть от конфигурации сборки.
ENV NODE_ENV=production
RUN npm run build

FROM base AS runner
WORKDIR /app

ARG VCS_REF=unknown
ARG SOURCE_URL=https://github.com/kiruhak11/kiruhak
ARG IMAGE_VERSION=development
ARG SOURCE_SNAPSHOT_SHA256=unknown

ENV NODE_ENV=production
ENV PORT=3015
ENV HOSTNAME=0.0.0.0

LABEL org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.source=$SOURCE_URL \
      org.opencontainers.image.title="Kiruhak Portfolio" \
      org.opencontainers.image.version=$IMAGE_VERSION \
      org.kstudio.source.snapshot.sha256=$SOURCE_SNAPSHOT_SHA256

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nuxtjs

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.output/server/node_modules ./node_modules

RUN chown -R nuxtjs:nodejs /app

USER nuxtjs
EXPOSE 3015
CMD ["node", ".output/server/index.mjs"]
