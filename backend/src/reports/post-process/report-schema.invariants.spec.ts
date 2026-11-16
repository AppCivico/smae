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
 * nome vira referência qualificada no builder e um label duplicado gera coluna ambígua no
 * Excel.
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

        it('não repete label entre colunas, ignorando caixa e espaços', () => {
            // O modelo padrão seleciona TODAS as colunas do schema, então duas colunas com o
            // mesmo label saem no mesmo CSV e o DuckDB desambigua sozinho, sufixando `_1`. O
            // usuário recebe "Orgão Concedente_1" sem nunca ter pedido isso.
            //
            // A comparação é case-insensitive porque a colisão real que motivou esta invariante
            // — 'Dotação Orçamentária' × 'Dotação orçamentária' — só diferia na caixa, e o
            // sufixo `_1` apareceu do mesmo jeito. Espaços nas pontas entram na normalização
            // pelo mesmo motivo: não são visíveis no cabeçalho.
            const porLabel = new Map<string, string[]>();
            for (const c of schema.colunas) {
                const chave = c.label.trim().toLocaleLowerCase('pt-BR');
                porLabel.set(chave, [...(porLabel.get(chave) ?? []), c.name]);
            }

            const colisoes = [...porLabel.entries()]
                .filter(([, nomes]) => nomes.length > 1)
                .map(([label, nomes]) => `${label}: ${nomes.join(', ')}`);

            expect(colisoes).toEqual([]);
        });

        it('declara fontes que produzem o arquivo', () => {
            expect(getReportRowsOptions(cls)!.fontes.length).toBeGreaterThan(0);
        });

        it('escopo de fonte das colunas é subconjunto das fontes do arquivo', () => {
            // Uma fonte no `@ReportColumn({ fontes })` que o `@ReportRows` não declara nunca
            // listaria a coluna — é erro de digitação, não restrição.
            const doArquivo = new Set(getReportRowsOptions(cls)!.fontes);
            const invalidas = colunas.flatMap(({ propriedade, options }) =>
                (options.fontes ?? []).filter((f) => !doArquivo.has(f)).map((f) => `${propriedade}: ${f}`)
            );
            expect(invalidas).toEqual([]);
        });

        it('mantém a ordem de declaração entre metadados e schema', () => {
            expect(schema.colunas.map((c) => c.name)).toEqual(colunas.map((c) => c.propriedade));
        });
    });
});
