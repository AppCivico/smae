FROM node:18-alpine

WORKDIR /usr/src/app

RUN npm --loglevel=error install -g npm@8.19.2

COPY --chown=1000:1000 package.json ./
COPY --chown=1000:1000 package-lock.json ./

RUN npm install

COPY prisma ./prisma/

RUN npx prisma generate

COPY ./* ./

RUN npm run build

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

CMD ["sh", "./run-api.sh"]
