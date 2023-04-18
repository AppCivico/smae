FROM node:18-bullseye as SMAE_API

# Instala o graphviz (dot) para gerar EAP do tarefas do lado do server-side
RUN apt-get update && apt-get install -y --no-install-recommends graphviz

# Instala as deps do wkhtmltopdf (html para PDF), que é um pouco mais simples que o WeasyPrint,
# muito mais leve do que usar o html-pdf-chrome ou Puppeteer
# pro nosso caso, ta otimo, nosso html é gerado por nos mesmos, então é safe
RUN apt-get install -y --no-install-recommends \ wkhtmltopdf

WORKDIR /usr/src/app

RUN npm --loglevel=error install -g npm@9.2.0

COPY --chown=1000:1000 package.json ./
COPY --chown=1000:1000 package-lock.json ./

RUN npm ci

COPY prisma/schema.prisma ./prisma/

RUN npx prisma generate

COPY . .

RUN npm run build

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

CMD ["sh", "./run-api.sh"]