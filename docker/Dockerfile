# --- stage 1 - build ---
FROM node:current-alpine AS builder
WORKDIR /app
COPY ../ .
RUN \
  apk add --no-cache uv && \
  uv sync && \
  ## Workaround for the error at build time reported in https://github.com/loganrooks/zlibrary-mcp/issues/8
  uv pip compile pyproject.toml -o requirements.txt && \
  npm install && \
  npm run build

# --- stage 2 - runtime ---
FROM ghcr.io/supercorp-ai/supergateway:3.4.3 AS runner

WORKDIR /app

COPY --from=builder /app/pyproject.toml ./pyproject.toml
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/zlibrary ./zlibrary/

RUN \
  apk add --no-cache uv && \
  uv sync

COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/lib ./lib/


