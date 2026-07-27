/* eslint-disable no-console */
// postinstall: roda `prisma generate` se o schema estiver presente.
// O Prisma 7 (client v7) NÃO gera o client automaticamente no install, então precisamos
// dispará-lo. O guard "schema existe?" é o que mantém o cache de layers do Docker:
// lá o `npm ci` roda ANTES do COPY do prisma/ (para a layer de deps não invalidar quando
// o schema muda) — nesse caso o generate é pulado aqui e roda numa layer própria logo depois.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const schema = path.join(__dirname, '..', 'prisma', 'schema.prisma');
if (fs.existsSync(schema)) {
    execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
} else {
    console.log('[postinstall] prisma/schema.prisma ausente — pulando prisma generate (Docker npm ci layer)');
}
