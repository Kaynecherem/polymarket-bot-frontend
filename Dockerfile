FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* package-lock.json* ./
RUN corepack enable && ([ -f pnpm-lock.yaml ] && pnpm install --frozen-lockfile || npm ci)

FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
ARG NEXT_PUBLIC_API_URL=http://localhost:8080/api
ARG NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && ([ -f pnpm-lock.yaml ] && pnpm build || npx next build)

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next-prod/standalone ./
COPY --from=builder /app/.next-prod/static ./.next-prod/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
