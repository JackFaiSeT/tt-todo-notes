ARG NODE_IMAGE=node:24.22.1-alpine3.23@sha256:0468540aa58203ff9e40c2aab3907c52644ab818af6176b1c70a026137dc92a2
FROM ${NODE_IMAGE} AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY nuxt.config.ts tsconfig.json ./
COPY config/ ./config/
COPY src/ ./src/
RUN pnpm build

FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production NITRO_HOST=0.0.0.0 NITRO_PORT=8080 NUXT_DATABASE_PATH=/data/notes.sqlite
WORKDIR /app
RUN mkdir -p /data && chown node:node /data
COPY --from=build /app/.output ./.output
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=4s --start-period=10s CMD ["node", "-e", "fetch('http://127.0.0.1:8080/api/readyz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["node", ".output/server/index.mjs"]
