# 1. Базовий образ Node.js
FROM node:22-alpine AS base

# 2. Встановлення залежностей
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 3. Збірка проєкту
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ОДРАЗУ ПЕРЕД БІЛДОМ: Приймаємо змінну та передаємо її в середовище
ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

# Важливо: у next.config.ts має бути вказано output: 'standalone'
RUN npm run build

# 4. Фінальний образ для запуску (Production)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Копіюємо лише те, що потрібно для запуску
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]