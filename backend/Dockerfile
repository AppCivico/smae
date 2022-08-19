FROM node:16.14-alpine As development

WORKDIR /usr/src/app

RUN npm install -g npm@8.18.0

COPY package*.json ./

COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm run build

FROM node:16.14-alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

RUN npm install -g npm@8.18.0

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

COPY --from=development /usr/src/app/dist ./dist

RUN npx prisma generate

CMD ["npm", "run", "start:prod"]
