FROM docker.io/node:23-alpine AS builder

WORKDIR /app
COPY . .

RUN npm install && npm run build




FROM docker.io/caddy:2-alpine

EXPOSE 8080

COPY --from=builder /app/build /var/www
COPY Caddyfile /etc/caddy/Caddyfile
