
FROM node:18-alpine AS builder


WORKDIR /app


COPY package*.json ./


RUN npm install


COPY . .


RUN npm install -g typescript ts-node


RUN tsc


FROM node:18-alpine


WORKDIR /app


COPY --from=builder /app ./


RUN npm ci --only=production


EXPOSE 3000


CMD ["node", "dist/index.js"]