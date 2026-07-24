import { DuckDBInstance } from '@duckdb/node-api';
import { Database } from 'duckdb-async';
import { exit } from 'process';

// `excel` é necessário tanto pelo `duckdb-csv2xlsx` (LOAD excel) quanto pelo
// pós-processamento (`COPY ... TO ... (FORMAT xlsx)`). Sem o INSTALL explícito só funciona
// via autoload, que falha em instalação offline/airgapped.
const EXTENSIONS = ['https', 'postgres', 'sqlite', 'spatial', 'excel'];

/**
 * O DuckDB guarda extensões por versão (`~/.duckdb/extensions/<versão>/<plataforma>/`).
 * O repo tem DOIS bindings em versões diferentes (`duckdb-async` e `@duckdb/node-api`),
 * então instalar por um só deixaria o runtime do outro sem as extensões.
 */
async function instalarViaDuckdbAsync() {
    const db = await Database.create(':memory:');

    const [{ version }] = await db.all('SELECT version() AS version');
    console.log(`[duckdb-async] DuckDB ${version}`);

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
        console.log(`[node-api] DuckDB ${versionResult.getRowObjects()[0]?.version}`);

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
