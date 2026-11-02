# Multi-stage build for Cloud Run deployment
FROM node:22-slim AS builder

WORKDIR /app

COPY package.json ./
# Check if bun.lock exists, or npm install
RUN npm install

COPY . .

# Build Vite frontend assets
RUN npm run build

# Production runtime stage
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/src ./src

EXPOSE 8080

CMD ["npm", "run", "start"]
