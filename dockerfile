# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy prisma first (IMPORTANT)
COPY prisma ./prisma

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Run stage
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app ./

EXPOSE 3000
CMD ["npm", "start"]
