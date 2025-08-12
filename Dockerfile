# ---------- Backend Build ----------
FROM golang:1.24-alpine AS go-build

WORKDIR /app
COPY . .
RUN go mod download
RUN mkdir build
RUN go build -o build/app ./cmd/app

# ---------- Frontend Build ----------
FROM node:20-alpine AS development-dependencies-env
COPY frontend /frontend
WORKDIR /frontend
RUN npm ci

FROM node:20-alpine AS production-dependencies-env
COPY frontend/package.json frontend/package-lock.json /frontend/
WORKDIR /frontend
RUN npm ci --omit=dev

FROM node:20-alpine AS frontend-build
COPY frontend /frontend
COPY --from=development-dependencies-env /frontend/node_modules /frontend/node_modules
WORKDIR /frontend
RUN npm run build

# ---------- Final Image ----------
FROM node:20-alpine

# Backend binaries
COPY --from=go-build /app/build/* /usr/local/bin/

# Backend SQL files
WORKDIR /app
RUN mkdir -p databases/starter
COPY --from=go-build /app/databases/starter/*.sql ./databases/starter/

# Frontend files
COPY frontend /frontend
COPY --from=frontend-build /frontend/build /frontend/build
COPY --from=production-dependencies-env /frontend/node_modules /frontend/node_modules

WORKDIR /app

# Install Caddy
RUN apk add --no-cache caddy

# Copy Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

# Final CMD
CMD sh -c "app & cd /frontend && npm run start & caddy run --config /etc/caddy/Caddyfile"
