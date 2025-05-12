##### DEPENDENCIES

ARG BASE_IMAGE=node:20.18.3-alpine
FROM --platform=linux/amd64 ${BASE_IMAGE} AS deps
WORKDIR /app

ENV OPENAI_API_KEY="placeholder_for_build"
RUN echo OPENAI_API_KEY

# Install Prisma Client - remove if not using Prisma

COPY prisma ./

# Install dependencies based on the preferred package manager

COPY package.json package-lock.json* ./

RUN npm ci;

##### DEVCONTAINER

FROM --platform=linux/amd64 ${BASE_IMAGE} AS devcontainer

# Add your packages here
RUN apk add --no-cache git

##### BUILDER

FROM --platform=linux/amd64 ${BASE_IMAGE} AS builder
ARG DATABASE_URL
ARG NEXT_PUBLIC_CLIENTVAR
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ENV NEXT_TELEMETRY_DISABLED 1
RUN SKIP_ENV_VALIDATION=1 npm run build;
ENV DATABASE_URL file:./db/db.sqlite

# RUN npm run build

##### RUNNER

FROM --platform=linux/amd64 ${BASE_IMAGE} AS runner
WORKDIR /app
COPY prisma/db.sqlite ./

ENV NODE_ENV production

# ENV NEXT_TELEMETRY_DISABLED 1
USER root

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma/db.sqlite /app/



USER root
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]