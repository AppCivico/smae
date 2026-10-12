// Remover quando https://github.com/prisma/orm/pull/30199 sair numa release 7.x
const fs = require('fs');
const path = require('path');

function patch() {
    let cli;
    try {
        cli = path.join(path.dirname(require.resolve('prisma/package.json')), 'build', 'cli.js');
    } catch {
        return;
    }

    const src = fs.readFileSync(cli, 'utf8');
    const re =
        /(typeNeedsGenericModelArg\(\w+\)\{return this\._cache\.getOrCreate\(\w+,\(\)=>\{let (\w+)=\[\{type:\w+\}\],\w+=new Set,(\w+));for\(;\3=\2\.shift\(\);\)/g;
    let n = 0;
    const out = src.replace(re, (_, decl, queue, item) => {
        n++;
        return `${decl},__head=0;for(;${item}=${queue}[__head++];)`;
    });

    if (n) {
        const tmp = `${cli}.${process.pid}.tmp`;
        fs.writeFileSync(tmp, out);
        fs.renameSync(tmp, cli);
        console.log(`[patch-prisma-generate] typeNeedsGenericModelArg sem shift() (${n}x)`);
    } else if (!src.includes('__head=0;for(;')) {
        console.log('[patch-prisma-generate] padrão não encontrado, nada a fazer');
    }
}

patch();
