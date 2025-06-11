FROM node:20-bookworm AS smae_api

# Instala o graphviz (dot) para gerar EAP do tarefas do lado do server-side
RUN apt-get update && apt-get install -y --no-install-recommends graphviz

# Instala as deps do wkhtmltopdf (html para PDF), que é um pouco mais simples que o WeasyPrint,
# muito mais leve do que usar o html-pdf-chrome ou Puppeteer
# pro nosso caso, ta otimo, nosso html é gerado por nos mesmos, então é safe
RUN apt-get install -y --no-install-recommends wkhtmltopdf fontconfig

RUN mkdir -p /usr/share/fonts/truetype/roboto

COPY ./fonts/* /usr/share/fonts/truetype/roboto/

RUN fc-cache -f -v

WORKDIR /usr/src/app

RUN npm --loglevel=error install -g npm@11.4.0

COPY package.json ./
COPY package-lock.json ./

COPY vendor/* ./vendor/

RUN npm ci

COPY tools/install-duckdb-extensions.js ./tools/

RUN node tools/install-duckdb-extensions.js

COPY prisma/schema.prisma ./prisma/

RUN npx prisma generate

COPY . .

ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm run build

RUN mkdir /usr/src/app/logs && chown node:node /usr/src/app/logs
USER node

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV USE_FILE_LOG=1
ENV PORT=3001

HEALTHCHECK CMD curl --fail localhost:${PORT:-3001}/api/ping || exit 1

CMD ["sh", "./run-api.sh"]
