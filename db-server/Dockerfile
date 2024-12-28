FROM node:18-alpine AS builder

RUN apk add --no-cache openssl libssl1.1

WORKDIR /app


COPY package*.json ./


RUN npm install


COPY . .


RUN npm install -g typescript ts-node
RUN npm install --save-dev @types/node


RUN tsc

RUN npx prisma generate


CMD ["node", "dist/index.js"]