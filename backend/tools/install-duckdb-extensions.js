/* eslint-disable no-console */
// Instala as extensões do DuckDB no cache local.
//
// JS puro, em tools/, de propósito: no Dockerfile isto roda ANTES do `npm run build` (para a
// layer de extensões não invalidar a cada mudança de código), então não existe `dist/` para
// rodar, e um .ts exigiria ts-node + tsconfig na imagem. Este arquivo é a ÚNICA fonte da
// lista — o `npm run duckdb:extensions` roda exatamente ele, para que o que o dev executa e
// o que a imagem executa não possam divergir. Já divergiram: a cópia anterior era um build
// defasado que instalava só um dos dois bindings.
const { Database } = require('duckdb-async');
const { DuckDBInstance } = require('@duckdb/node-api');
const { exit } = require('process');

// `excel` é necessário tanto pelo `duckdb-csv2xlsx` (LOAD excel) quanto pelo
// pós-processamento (`COPY ... TO ... (FORMAT xlsx)`). Sem o INSTALL explícito só funciona
// via autoload, que falha em instalação offline/airgapped.
const EXTENSIONS = ['https', 'postgres', 'sqlite', 'spatial', 'excel'];

/**
 * O DuckDB guarda extensões por versão E por usuário:
 * `$HOME/.duckdb/extensions/v<versão do DuckDB>/<plataforma>/`.
 *
 * Daí as duas exigências que este script tem que satisfazer, e que já foram quebradas:
 *   1. rodar pelos DOIS bindings — `duckdb-async` e `@duckdb/node-api` estão em versões
 *      diferentes de DuckDB, então instalar por um só deixa o runtime do outro sem extensão;
 *   2. rodar como o MESMO usuário que executa a API (`node` na imagem, não root), senão o
 *      cache cai em /root/.duckdb e a aplicação não o encontra.
 */
async function instalarViaDuckdbAsync() {
    const db = await Database.create(':memory:');

    const [{ version }] = await db.all('SELECT version() AS version');
    console.log(`[duckdb-async] DuckDB ${version} (HOME=${process.env.HOME})`);

    for (const extension of EXTENSIONS) {
        console.log(`[duckdb-async] Installing ${extension} extension`);
        const feedback = await db.all(`INSTALL ${extension}`);
        if (feedback.length > 0) {
            console.error(feedback);
            exit(1);
        }
    }

    await db.close();
}

async function instalarViaNodeApi() {
    const instance = await DuckDBInstance.create(':memory:');
    const con = await instance.connect();

    try {
        const versionResult = await con.runAndReadAll('SELECT version() AS version');
        console.log(`[node-api] DuckDB ${versionResult.getRowObjects()[0]?.version} (HOME=${process.env.HOME})`);

        for (const extension of EXTENSIONS) {
            console.log(`[node-api] Installing ${extension} extension`);
            try {
                await con.run(`INSTALL ${extension}`);
            } catch (error) {
                console.error(error);
                exit(1);
            }
        }
    } finally {
        con.disconnectSync();
    }
}

async function bootstrap() {
    await instalarViaDuckdbAsync();
    await instalarViaNodeApi();
}
bootstrap();
