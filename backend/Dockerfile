FROM node:16.14-alpine

WORKDIR /usr/src/app

RUN npm install -g npm@8.19.2

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

CMD ["sh", "./run-api.sh"]
