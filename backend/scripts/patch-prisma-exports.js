#!/usr/bin/env node
/**
 * Patches @prisma/client-runtime-utils package.json to export ./dist subpath.
 *
 * Prisma 7's NestJS swagger plugin generates require("@prisma/client-runtime-utils/dist")
 * in metadata, but the package's exports map doesn't include "./dist".
 * Node 24 enforces exports strictly, causing ERR_PACKAGE_PATH_NOT_EXPORTED.
 *
 * This patch adds "./dist" and "./dist/*" to the exports map.
 * Can be removed once Prisma fixes this upstream.
 */
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(
    __dirname,
    '..',
    'node_modules',
    '@prisma',
    'client-runtime-utils',
    'package.json'
);

if (!fs.existsSync(pkgPath)) {
    // Package not installed yet, skip
    process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

if (pkg.exports && !pkg.exports['./dist']) {
    pkg.exports['./dist'] = {
        require: {
            types: './dist/index.d.ts',
            default: './dist/index.js',
        },
        import: {
            types: './dist/index.d.ts',
            default: './dist/index.mjs',
        },
    };
    pkg.exports['./dist/*'] = './dist/*';

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log('[patch] Added ./dist exports to @prisma/client-runtime-utils');
} else {
    console.log('[patch] @prisma/client-runtime-utils exports already patched or not needed');
}
