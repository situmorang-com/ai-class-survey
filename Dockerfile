# syntax=docker/dockerfile:1.7

# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# better-sqlite3 needs build tools to compile its native binding
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

# ---- runtime stage ----
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache tini && addgroup -S app && adduser -S app -G app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DB_PATH=/data/survey.db

# Persisted SQLite data (mount a volume here in Coolify)
RUN mkdir -p /data && chown -R app:app /data
VOLUME ["/data"]

COPY --from=build --chown=app:app /app/build ./build
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/package.json ./

USER app
EXPOSE 3000

ENTRYPOINT ["/sbin/tini","--"]
CMD ["node","build"]
