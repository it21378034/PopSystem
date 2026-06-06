FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build || echo 'no build step'

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "src/app.js"]
