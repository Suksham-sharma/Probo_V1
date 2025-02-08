
FROM node:18-alpine AS builder

ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY

WORKDIR /app


COPY package*.json ./


RUN npm install


COPY . .


RUN npm install -g typescript ts-node


RUN tsc


FROM node:18-alpine


WORKDIR /app


COPY --from=builder /app ./

ENV AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
ENV AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY

RUN npm ci --only=production


CMD ["node", "dist/index.js"]