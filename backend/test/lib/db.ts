import { randomBytes } from 'crypto';
import { Client } from 'pg';

const SAFE_DB = /^smae_test_run\d+_/;

function env(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`${name} ausente: rode os testes com "npm run test:e2e -- <arquivo>"`);
    return v;
}

export function urlDoBanco(dbName: string): string {
    const url = new URL(env('E2E_PG_URL'));
    url.pathname = '/' + dbName;
    return url.toString();
}

/** Clona o banco base (TEMPLATE) num banco exclusivo deste processo e aponta DATABASE_URL para ele. */
export async function clonarBancoDeTeste(): Promise<string> {
    const nome = `${env('E2E_CLONE_PREFIX')}${process.pid}_${randomBytes(3).toString('hex')}`;
    if (!SAFE_DB.test(nome)) throw new Error(`nome de banco inseguro: ${nome}`);

    const admin = new Client({ connectionString: env('E2E_PG_URL') });
    await admin.connect();
    try {
        // shared: vários clones em paralelo, mas nunca durante a reconstrução do base
        await admin.query('SELECT pg_advisory_lock_shared($1)', [+env('E2E_LOCK_KEY')]);
        await admin.query(`CREATE DATABASE "${nome}" TEMPLATE "${env('E2E_BASE_DB')}"`);
    } finally {
        await admin.end();
    }

    process.env.DATABASE_URL = urlDoBanco(nome);
    return nome;
}
