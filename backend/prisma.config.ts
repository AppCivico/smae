import 'dotenv/config';
import path from 'node:path';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
    schema: path.join('prisma', 'schema.prisma'),
    migrations: {
        path: path.join('prisma', 'migrations'),
        seed: 'ts-node prisma/seed.ts',
    },
    // datasource só é exigido por comandos de migrate/introspect; `prisma generate` não precisa.
    // Condicional para o `generate` funcionar no build do Docker, onde não há DATABASE_URL.
    ...(process.env.DATABASE_URL ? { datasource: { url: env('DATABASE_URL') } } : {}),
});
