#!/usr/bin/env node
/* eslint-disable no-console */
// Typecheck rápido com TS7 (tsgo). Diagnósticos que só o TS7 acusa ficam em typecheck-baseline.json.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const BASELINE = path.join(__dirname, 'typecheck-baseline.json');
const args = process.argv.slice(2);
const withTests = args.includes('--with-tests');
const writeBaseline = args.includes('--write-baseline');

const t0 = Date.now();
const r = spawnSync(
    path.join(ROOT, 'node_modules/.bin/tsgo'),
    ['-p', 'tsconfig.e2e.json', '--noEmit', '--pretty', 'false'],
    {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
    }
);
if (r.error) throw r.error;

const diags = [];
for (const line of (r.stdout + r.stderr).split('\n')) {
    const m = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): /);
    if (m) diags.push({ file: m[1], code: m[4], text: line });
    else if (diags.length && line.startsWith(' ')) diags[diags.length - 1].text += '\n' + line;
}
const escopo = diags.filter((d) => withTests || !d.file.startsWith('test/'));

const contagem = {};
for (const d of escopo.filter((d) => !d.file.startsWith('test/'))) {
    const k = `${d.file} ${d.code}`;
    contagem[k] = (contagem[k] || 0) + 1;
}

if (writeBaseline) {
    const ordenado = Object.fromEntries(Object.entries(contagem).sort(([a], [b]) => a.localeCompare(b)));
    fs.writeFileSync(BASELINE, JSON.stringify(ordenado, null, 4) + '\n');
    console.log(`baseline gravado: ${Object.keys(ordenado).length} entradas`);
    process.exit(0);
}

const baseline = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
const novos = escopo.filter((d) => {
    const k = `${d.file} ${d.code}`;
    return d.file.startsWith('test/') || (contagem[k] || 0) > (baseline[k] || 0);
});

const segundos = ((Date.now() - t0) / 1000).toFixed(1);
if (novos.length) {
    console.error(novos.map((d) => d.text).join('\n'));
    console.error(`\n${novos.length} erro(s) de tipo fora do baseline (${segundos}s)`);
    process.exit(1);
}
const conhecidos = escopo.length;
console.log(
    `typecheck ok em ${segundos}s (${conhecidos} diagnóstico(s) conhecidos do TS7 ignorados, ver scripts/e2e/typecheck-baseline.json)`
);
