# syntax=docker/dockerfile:1

########################################
# Stage 1: build — install semua dependency (termasuk dev), generate
# Prisma Client, compile TypeScript ke JavaScript.
########################################
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

########################################
# Stage 2: runner — image yang benar-benar dijalankan di production.
# Node modules (termasuk devDependencies) sengaja ikut disalin utuh dari
# stage builder supaya `prisma` CLI tetap tersedia untuk `prisma migrate
# deploy` saat container start, tanpa perlu install ulang / prisma
# generate ulang di sini (Prisma Client hasil generate ikut ke-copy).
########################################
FROM node:22-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/prisma.config.ts ./prisma.config.ts

# Folder tempat file upload disimpan (lihat multer.config.ts,
# document-multer.config.ts, user.service.ts) — di-mount sebagai volume
# lewat docker-compose supaya persist antar deploy.
RUN mkdir -p /app/uploads && chown node:node /app/uploads

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1:3000/ || exit 1

# Jalankan migration yang belum ter-apply (aman/idempotent), baru start app.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
