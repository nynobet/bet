FROM node:18-alpine AS base

RUN apk add --no-cache libc6-compat openssl \
  && corepack enable \
  && corepack prepare pnpm@latest --activate

WORKDIR /app

FROM base AS deps

# Copy package files first to leverage Docker layer caching
COPY package.json pnpm-lock.yaml ./
COPY prisma/schema.prisma ./prisma/schema.prisma

# Install all dependencies (including devDeps for build)
RUN pnpm install --frozen-lockfile

FROM deps AS builder

# Copy the rest of the application source
COPY . .

# Ensure Prisma client is generated for the build
RUN pnpm prisma generate

# Build the Next.js application
RUN NODE_OPTIONS=--max_old_space_size=4096 pnpm build

# Remove dev dependencies while skipping scripts (avoids prisma regenerate)
RUN pnpm prune --prod --ignore-scripts

FROM base AS runner

ENV NODE_ENV=production

# Copy the built application and production dependencies
COPY --from=builder /app .

EXPOSE 3000

CMD ["pnpm", "start"]