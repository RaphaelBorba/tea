FROM node:20-alpine AS builder
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Build
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production deps
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# Copy build artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env.example ./.env.example

EXPOSE 3000
CMD ["node", "dist/main.js"]


