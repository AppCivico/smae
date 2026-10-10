#!/usr/bin/env node
/* eslint-disable no-console */
const { spawn, spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');

const ROOT = path.resolve(__dirname, '../..');
const OUT_ROOT = path.join(ROOT, 'dist-test');
const RUN_ID = String(process.pid);
const OUT_DIR = path.join(OUT_ROOT, `run-${RUN_ID}`);
const PRELOAD = path.join(__dirname, 'preload.js');
const TSGO = path.join(ROOT, 'node_modules/.bin/tsgo');

const BASE_PREFIX = 'smae_test_base_';
const CLONE_PREFIX = 'smae_test_run';
const LOCK_KEY = 772026001;
const KEEP_BASES = 3;
// The .env points some of these at real homol services; tests must never reach them.
const EXTERNAL_SERVICES = [
    'S3_HOST',
    'SEI_HOST',
    'SOF_API_PREFIX',
    'GEO_API_PREFIX',
    'TRANSFEREGOV_API_PREFIX',
    'GOTENBERG_URL',
];
const SAFE_DB = /^smae_test_(base_[0-9a-f]{12}$|build\d+$|run\d+_)/;

const fileEnv = dotenv.parse(fs.existsSync(path.join(ROOT, '.env')) ? fs.readFileSync(path.join(ROOT, '.env')) : '');

function pgUrl(dbName) {
    const raw = process.env.E2E_PG_URL || fileEnv.DATABASE_URL || process.env.DATABASE_URL;
    if (!raw) throw new Error('E2E_PG_URL (ou DATABASE_URL no .env) precisa apontar para um servidor postgres');
    const url = new URL(raw);
    url.pathname = '/' + dbName;
    url.search = '';
    return url.toString();
}

function assertSafeDb(name) {
    if (!SAFE_DB.test(name))
        throw new Error(`recusando operar no banco "${name}": só bancos smae_test_* gerenciados aqui`);
}

function parseArgs(argv) {
    const files = [];
    const nodeArgs = [];
    let keep = !!process.env.E2E_KEEP;
    let compileOnly = false;
    for (const a of argv) {
        if (a === '--keep') keep = true;
        else if (a === '--compile-only') compileOnly = true;
        else if (a.startsWith('-')) nodeArgs.push(a);
        else files.push(a);
    }
    return { files, nodeArgs, keep, compileOnly };
}

function walkSpecs(dir) {
    const out = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) out.push(...walkSpecs(p));
        else if (e.name.endsWith('.e2e-spec.ts')) out.push(p);
    }
    return out;
}

function resolveSpecs(args) {
    const inputs = args.length ? args : ['test'];
    const specs = new Set();
    for (const a of inputs) {
        const abs = path.resolve(ROOT, a);
        if (!fs.existsSync(abs)) throw new Error(`não encontrado: ${a}`);
        if (fs.statSync(abs).isDirectory()) walkSpecs(abs).forEach((s) => specs.add(s));
        else if (abs.endsWith('.e2e-spec.ts')) specs.add(abs);
        else throw new Error(`não é um *.e2e-spec.ts: ${a}`);
    }
    return [...specs].sort().map((s) => path.relative(ROOT, s));
}

function isAlive(pid) {
    try {
        process.kill(pid, 0);
        return true;
    } catch (e) {
        return e.code === 'EPERM';
    }
}

function parseDiagnostics(output) {
    const diags = [];
    for (const line of output.split('\n')) {
        const m = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/);
        if (m) diags.push({ file: m[1], code: m[4], text: line });
        else if (diags.length && line.startsWith(' ')) diags[diags.length - 1].text += '\n' + line;
    }
    return diags;
}

function compile(specs, allSelected) {
    const t0 = Date.now();
    const r = spawnSync(TSGO, ['-p', 'tsconfig.e2e.json', '--outDir', OUT_DIR, '--pretty', 'false'], {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
    });
    if (r.error) throw r.error;
    const diags = parseDiagnostics(r.stdout + r.stderr);
    const relevant = (d) =>
        d.file.startsWith('test/lib/') || specs.includes(d.file) || (allSelected && d.file.startsWith('test/'));
    const blocking = diags.filter(relevant);
    const otherTests = new Set(diags.filter((d) => d.file.startsWith('test/') && !relevant(d)).map((d) => d.file));
    console.log(`[e2e] compilado em ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${path.relative(ROOT, OUT_DIR)}`);
    if (otherTests.size)
        console.log(`[e2e] aviso: erros de tipo em outros specs (ignorados): ${[...otherTests].join(', ')}`);
    if (blocking.length) {
        console.error(blocking.map((d) => d.text).join('\n'));
        console.error(`[e2e] ${blocking.length} erro(s) de tipo nos specs selecionados ou em test/lib`);
        return false;
    }
    for (const asset of ['public', 'templates']) {
        fs.symlinkSync(path.join(ROOT, 'src', asset), path.join(OUT_DIR, asset));
    }
    return true;
}

function seedHash() {
    const h = crypto.createHash('sha256');
    const files = [];
    const collect = (dir) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, e.name);
            if (e.isDirectory()) collect(p);
            else files.push(p);
        }
    };
    collect(path.join(ROOT, 'prisma/migrations'));
    collect(path.join(ROOT, 'prisma/manual-copy'));
    const seed = path.join(ROOT, 'prisma/seed.ts');
    files.push(seed, __filename);
    for (const m of fs.readFileSync(seed, 'utf8').matchAll(/from '(\.{1,2}\/[^']+)'/g)) {
        const f = path.resolve(path.dirname(seed), m[1] + '.ts');
        if (fs.existsSync(f)) files.push(f);
    }
    for (const f of files.sort()) {
        h.update(path.relative(ROOT, f));
        h.update(fs.readFileSync(f));
    }
    return h.digest('hex').slice(0, 32);
}

async function adminClient() {
    const c = new Client({ connectionString: pgUrl('postgres') });
    await c.connect();
    return c;
}

async function dropDb(c, name) {
    assertSafeDb(name);
    await c.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1', [name]);
    await c.query(`ALTER DATABASE "${name}" WITH IS_TEMPLATE false`).catch(() => {});
    await c.query(`DROP DATABASE IF EXISTS "${name}"`);
}

function runStep(label, cmd, args, env, logFile) {
    const t0 = Date.now();
    fs.appendFileSync(logFile, `\n### ${label}: ${cmd} ${args.join(' ')}\n`);
    const r = spawnSync(cmd, args, { cwd: ROOT, env, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
    fs.appendFileSync(logFile, (r.stdout || '') + (r.stderr || ''));
    console.log(`[e2e]   ${label}: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    if (r.status !== 0) {
        const tail = ((r.stdout || '') + (r.stderr || '')).split('\n').slice(-40).join('\n');
        throw new Error(`${label} falhou (log completo em ${logFile}):\n${tail}`);
    }
}

// The seed inserts rows with fixed ids (orgao 1, tipo_orgao 1...) without advancing the sequences.
async function syncSequences(dbName) {
    const c = new Client({ connectionString: pgUrl(dbName) });
    await c.connect();
    try {
        await c.query(`
            DO $$
            DECLARE r record;
            BEGIN
                FOR r IN
                    SELECT n.nspname, t.relname, a.attname, pg_get_serial_sequence(format('%I.%I', n.nspname, t.relname), a.attname) AS seq
                    FROM pg_attribute a
                    JOIN pg_class t ON t.oid = a.attrelid AND t.relkind = 'r'
                    JOIN pg_namespace n ON n.oid = t.relnamespace AND n.nspname = 'public'
                    WHERE a.attnum > 0 AND NOT a.attisdropped
                LOOP
                    IF r.seq IS NOT NULL THEN
                        EXECUTE format('SELECT setval(%L, GREATEST(COALESCE((SELECT max(%I) FROM %I.%I), 0) + 1, 1), false)',
                            r.seq, r.attname, r.nspname, r.relname);
                    END IF;
                END LOOP;
            END $$;
        `);
    } finally {
        await c.end();
    }
}

async function ensureBaseDb(force) {
    const baseDb = BASE_PREFIX + seedHash().slice(0, 12);
    const c = await adminClient();
    try {
        await c.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
        const r = await c.query('SELECT 1 FROM pg_database WHERE datname = $1', [baseDb]);
        if (r.rowCount && !force) return baseDb;

        console.log(`[e2e] construindo ${baseDb} (migrations, manual-copy, seed ou este script mudaram)`);
        const t0 = Date.now();
        const buildDb = `smae_test_build${RUN_ID}`;
        await dropDb(c, buildDb);
        await c.query(`CREATE DATABASE "${buildDb}"`);

        // Production installs these by hand; the migration 20250602210346_cube_ext is commented out.
        const ext = new Client({ connectionString: pgUrl(buildDb) });
        await ext.connect();
        await ext.query('CREATE EXTENSION IF NOT EXISTS cube; CREATE EXTENSION IF NOT EXISTS earthdistance');
        await ext.end();

        const env = {
            ...fileEnv,
            ...process.env,
            DATABASE_URL: pgUrl(buildDb),
            NODE_PATH: OUT_DIR,
            NODE_OPTIONS: `--require ${PRELOAD}`,
            PGSQL_DIR: './prisma/manual-copy/',
        };
        const logFile = path.join(OUT_ROOT, `base-build-${RUN_ID}.log`);
        fs.writeFileSync(logFile, '');
        runStep(
            'prisma migrate deploy',
            path.join(ROOT, 'node_modules/.bin/prisma'),
            ['migrate', 'deploy'],
            env,
            logFile
        );
        runStep('pgsql-migrate', process.execPath, [path.join(OUT_DIR, 'bin/pgsql-migrate.js')], env, logFile);
        runStep('seed', process.execPath, [path.join(OUT_DIR, 'prisma/seed.js')], env, logFile);
        await syncSequences(buildDb);

        await dropDb(c, baseDb);
        await c.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1', [buildDb]);
        await c.query(`ALTER DATABASE "${buildDb}" RENAME TO "${baseDb}"`);
        await c.query(`ALTER DATABASE "${baseDb}" WITH IS_TEMPLATE true ALLOW_CONNECTIONS false`);
        fs.rmSync(logFile, { force: true });
        console.log(`[e2e] ${baseDb} pronto em ${((Date.now() - t0) / 1000).toFixed(1)}s`);

        const antigos = await c.query(
            `SELECT datname FROM pg_database WHERE datname LIKE 'smae\\_test\\_base\\_%' AND datname <> $1
             ORDER BY oid DESC OFFSET $2`,
            [baseDb, KEEP_BASES - 1]
        );
        for (const { datname } of antigos.rows) if (SAFE_DB.test(datname)) await dropDb(c, datname);
        return baseDb;
    } finally {
        await c.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]).catch(() => {});
        await c.end();
    }
}

async function cleanup(runIds) {
    const c = await adminClient();
    try {
        const r = await c.query(`SELECT datname FROM pg_database WHERE datname LIKE 'smae\\_test\\_%'`);
        for (const { datname } of r.rows) {
            const m = datname.match(/^smae_test_run(\d+)_/) || datname.match(/^smae_test_build(\d+)$/);
            if (m && runIds(+m[1])) await dropDb(c, datname);
        }
    } finally {
        await c.end();
    }
    if (fs.existsSync(OUT_ROOT)) {
        for (const e of fs.readdirSync(OUT_ROOT)) {
            const m = e.match(/^run-(\d+)$/) || e.match(/^base-build-(\d+)\.log$/);
            if (m && runIds(+m[1])) fs.rmSync(path.join(OUT_ROOT, e), { recursive: true, force: true });
        }
    }
}

function runTests(specs, nodeArgs, baseDb) {
    const concurrency = process.env.E2E_CONCURRENCY || String(Math.max(1, Math.min(4, os.availableParallelism() - 1)));
    const env = {
        ...fileEnv,
        ...process.env,
        TZ: fileEnv.TZ || process.env.TZ || 'UTC',
        DATABASE_URL: 'postgresql://e2e-clone-nao-criado/invalid',
        ...Object.fromEntries(EXTERNAL_SERVICES.map((k) => [k, 'http://127.0.0.1:9/'])),
        S3_ACCESS_KEY: 'e2e',
        S3_SECRET_KEY: 'e2e',
        DISABLED_CRONTABS: 'all',
        LOG_REQ_ON_DB: 'false',
        NODE_PATH: OUT_DIR,
        NODE_OPTIONS: `--require ${PRELOAD} --enable-source-maps`,
        E2E_RUN_ID: RUN_ID,
        E2E_PG_URL: pgUrl('postgres'),
        E2E_BASE_DB: baseDb,
        E2E_CLONE_PREFIX: `${CLONE_PREFIX}${RUN_ID}_`,
        E2E_LOCK_KEY: String(LOCK_KEY),
    };
    const args = [
        '--test',
        '--test-force-exit',
        `--test-concurrency=${concurrency}`,
        '--test-reporter=spec',
        '--test-timeout=120000',
        ...nodeArgs,
        ...specs.map((s) => path.join(OUT_DIR, s.replace(/\.ts$/, '.js'))),
    ];
    return new Promise((resolve) => {
        const child = spawn(process.execPath, args, { cwd: ROOT, env, stdio: 'inherit' });
        const forward = (sig) => child.kill(sig);
        process.on('SIGINT', forward);
        process.on('SIGTERM', forward);
        child.on('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
    });
}

async function main() {
    const { files, nodeArgs, keep, compileOnly } = parseArgs(process.argv.slice(2));
    const specs = resolveSpecs(files);
    if (!specs.length) throw new Error('nenhum *.e2e-spec.ts encontrado');

    fs.mkdirSync(OUT_ROOT, { recursive: true });
    await cleanup((pid) => !isAlive(pid));

    let code = 1;
    try {
        if (!compile(specs, files.length === 0)) return 1;
        if (compileOnly) return 0;
        const baseDb = await ensureBaseDb(!!process.env.E2E_REBUILD_BASE);
        const t0 = Date.now();
        code = await runTests(specs, nodeArgs, baseDb);
        console.log(`[e2e] ${specs.length} arquivo(s) em ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    } finally {
        if (!keep) await cleanup((pid) => pid === process.pid);
        else console.log(`[e2e] --keep: mantendo ${path.relative(ROOT, OUT_DIR)} e bancos ${CLONE_PREFIX}${RUN_ID}_*`);
    }
    return code;
}

main().then(
    (code) => process.exit(code),
    (err) => {
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
    }
);
