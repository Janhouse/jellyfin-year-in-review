FROM oven/bun:1-alpine AS base
RUN apk add --update --no-cache git wget \
  && rm -rf /var/cache/apk/*

FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build && \
    mkdir -p /app/public

# Production image, copy all the files and run next
FROM base AS runner

ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
ARG NEXT_PUBLIC_UMAMI_SRC
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_JELLYFIN_URL
ARG NEXT_PUBLIC_JELLYFIN_SERVER_ID
ARG NEXT_PUBLIC_SEER_URL

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/BUILD_ID ./.next/BUILD_ID

COPY ./entrypoint.sh ./
COPY ./email-template.html ./

RUN mkdir -p /app/.next/cache && chown nextjs:nodejs /app/.next/cache

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK  --interval=10s --timeout=5s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

ENTRYPOINT ["./entrypoint.sh"]

CMD ["bun", "--bun", "server.js"]
