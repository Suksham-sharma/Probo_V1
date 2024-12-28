FROM node:18-alpine AS builder


WORKDIR /app


COPY package*.json ./


RUN npm install


COPY . .


RUN npm install -g typescript ts-node


RUN tsc

RUN npx prisma generate


CMD ["node", "dist/index.js"]