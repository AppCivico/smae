FROM node:16.14-alpine As development

WORKDIR /usr/src/app

RUN npm install -g npm@8.18.0

COPY package*.json ./

COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm run build

FROM node:16.14-alpine as production

WORKDIR /usr/src/app

RUN npm install -g npm@8.18.0

COPY --from=development /usr/src/app/ .

RUN npx prisma generate

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

CMD ["sh", "./run-api.sh"]
