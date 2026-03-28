FROM oven/bun:1-alpine AS base
RUN apk add --update --no-cache git wget grep \
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

# Generate placeholder env and injection script by scanning source
RUN sh scripts/generate-env-scripts.sh

# Source the generated placeholders and build
# Using 'set -a' to export all variables from .env.baked
# BETTER_AUTH_SECRET/URL are build-time dummies to silence warnings during static page generation
RUN set -a && . ./.env.baked && set +a && \
    BETTER_AUTH_SECRET=build-placeholder-not-for-production-use-00000000 \
    BETTER_AUTH_URL=http://localhost:3000 \
    bun run build && \
    mkdir -p /app/public

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Add OCI labels for GitHub Container Registry
LABEL org.opencontainers.image.title="Jellyfin Year in Review"
LABEL org.opencontainers.image.description="Generate personalized year-in-review statistics and highlights from your Jellyfin media server"
LABEL org.opencontainers.image.source="https://github.com/Janhouse/jellyfin-year-in-review"
LABEL org.opencontainers.image.licenses="AGPL-3.0-or-later"
LABEL org.opencontainers.image.vendor="Janhouse"

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/.next/standalone/server.js ./
COPY --from=builder /app/.next/standalone/node_modules ./node_modules
COPY --from=builder /app/.next/standalone/.next ./.next
COPY --from=builder /app/.next/static ./.next/static

COPY --from=builder /app/.next/BUILD_ID ./.next/BUILD_ID

# Copy the generated injection script
COPY --from=builder /app/scripts/inject-env.sh ./scripts/

COPY ./entrypoint.sh ./
COPY ./email-template.html ./

RUN mkdir -p /app/.next/cache && \
    chown -R nextjs:nodejs /app/.next /app/public /app/scripts

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK  --interval=10s --timeout=5s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

ENTRYPOINT ["./entrypoint.sh"]

CMD ["bun", "--bun", "server.js"]
