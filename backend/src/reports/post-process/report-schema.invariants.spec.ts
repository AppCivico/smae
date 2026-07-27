import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';

import {
    getReportRowColumns,
    getReportRowSchema,
    getReportRowsOptions,
    listReportRowClasses,
} from './report-column.decorator';

/**
 * Carrega as classes de linha varrendo `src/reports/**\/entities/*.ts` e importando só os
 * arquivos que citam `@ReportRows` — a mesma descoberta que `bin/report-columns-gen.ts` faz.
 *
 * Antes esta lista era um bloco de `import` mantido à mão. Isso tinha dois defeitos: uma
 * entidade nova entrava sem invariante nenhuma rodando sobre ela (falha silenciosa, que é
 * justamente o que este arquivo existe para evitar), e todo PR que declarava um relatório
 * novo tocava as mesmas linhas — conflito garantido entre PRs irmãos.
 */
function arquivosDeEntidade(dir: string): string[] {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            out.push(...arquivosDeEntidade(full));
        } else if (
            path.basename(dir) === 'entities' &&
            entry.name.endsWith('.ts') &&
            !entry.name.endsWith('.d.ts') &&
            !entry.name.endsWith('.spec.ts')
        ) {
            out.push(full);
        }
    }
    return out;
}

for (const arquivo of arquivosDeEntidade(path.resolve(__dirname, '..'))) {
    if (!fs.readFileSync(arquivo, 'utf8').includes('@ReportRows')) continue;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require(arquivo);
}

/**
 * Invariantes que valem para QUALQUER schema declarado.
 *
 * Existem porque cada uma delas corresponde a uma falha real e silenciosa: um ponto no
 * nome vira referência qualificada no builder, um label duplicado gera coluna ambígua no
 * Excel, e um guard em coluna numérica transforma número em texto no XLSX.
 */
describe('invariantes dos schemas de relatório', () => {
    const classes = listReportRowClasses();

    it('há schemas registrados', () => {
        expect(classes.length).toBeGreaterThan(0);
    });

    describe.each(classes.map((c) => [getReportRowsOptions(c)!.arquivo, c] as const))('%s', (_arquivo, cls) => {
        const schema = getReportRowSchema(cls);
        const colunas = getReportRowColumns(cls);

        it('não usa ponto no nome das colunas', () => {
            // O builder DuckDB trata `a.b` como referência qualificada por fonte; o
            // aninhamento no CSV bruto usa `__`.
            const comPonto = schema.colunas.filter((c) => c.name.includes('.')).map((c) => c.name);
            expect(comPonto).toEqual([]);
        });

        it('não repete nome de coluna', () => {
            const nomes = schema.colunas.map((c) => c.name);
            expect(nomes).toEqual([...new Set(nomes)]);
        });

        it('declara label não vazio em toda coluna', () => {
            expect(schema.colunas.filter((c) => !c.label?.trim())).toEqual([]);
        });

        it('não aplica guard de texto do Excel em coluna numérica ou de data', () => {
            // Guard emite `="valor"`: em coluna tipada isso viraria texto no XLSX,
            // perdendo a soma/ordenação que é justamente o ponto do tipo nativo.
            const invalidas = schema.colunas
                .filter((c) => c.format?.excelTextGuard && c.type !== 'VARCHAR')
                .map((c) => `${c.name} (${c.type})`);
            expect(invalidas).toEqual([]);
        });

        it('declara fontes que produzem o arquivo', () => {
            expect(getReportRowsOptions(cls)!.fontes.length).toBeGreaterThan(0);
        });

        it('mantém a ordem de declaração entre metadados e schema', () => {
            expect(schema.colunas.map((c) => c.name)).toEqual(colunas.map((c) => c.propriedade));
        });
    });
});
