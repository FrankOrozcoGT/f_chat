# ========================================
# Stage 1: Builder
# ========================================
FROM node:24-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build arguments para variables de entorno en build time
ARG VITE_API_BASE_URL
ARG VITE_WS_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_GOOGLE_AUTH_URL

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_AUTH_URL=$VITE_GOOGLE_AUTH_URL

# Build de Vite
RUN npm run build

# ========================================
# Stage 2: Production Runtime
# ========================================
FROM node:24-alpine

RUN npm i -g serve

WORKDIR /app

# Copiar build desde stage anterior
COPY --from=builder /app/dist ./dist

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Comando de inicio (-s = SPA mode, redirige todas las rutas a index.html)
CMD ["serve", "-s", "dist", "-l", "80"]
