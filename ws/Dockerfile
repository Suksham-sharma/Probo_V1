
FROM node:18-alpine AS builder


WORKDIR /app


COPY package*.json ./


RUN npm install


COPY . .


RUN npm install -g typescript


RUN tsc


FROM node:18-alpine


WORKDIR /app


COPY --from=builder /app ./


RUN npm ci --only=production


EXPOSE 8080


CMD ["node", "dist/index.js"]