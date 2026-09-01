# Built from the monorepo root: `docker build -f apps/api/Dockerfile .`
# npm workspaces hoist node_modules to the repo root, and `npm ci` needs
# every workspace's package.json present to match package-lock.json, even
# ones this image doesn't run — so copy all of them before installing, then
# only copy real source for apps/api.

FROM node:20-alpine AS builder
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/api/prisma apps/api/prisma
COPY apps/web/package.json apps/web/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/types/package.json packages/types/package.json
# apps/api's own postinstall runs `prisma generate`, which needs the
# schema present — hence copying apps/api/prisma before `npm ci`, ahead
# of the rest of apps/api's source for better layer caching.
RUN npm ci

COPY apps/api apps/api
RUN npm run build --workspace=apps/api

FROM node:20-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production

# Full node_modules (not pruned to prod-only) — simplest reliable option
# for an npm-workspaces monorepo; revisit if image size becomes a problem.
COPY --from=builder /repo/node_modules node_modules
COPY --from=builder /repo/apps/api/dist apps/api/dist
COPY --from=builder /repo/apps/api/prisma apps/api/prisma
COPY --from=builder /repo/apps/api/package.json apps/api/package.json
# prisma.config.ts carries the datasource url (schema.prisma has none) —
# without it, `prisma migrate deploy` in this container has nowhere to read
# DATABASE_URL from and fails, even though the app itself (PrismaService
# builds its own connection from ConfigService) runs fine without it.
COPY --from=builder /repo/apps/api/prisma.config.ts apps/api/prisma.config.ts

WORKDIR /repo/apps/api
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
