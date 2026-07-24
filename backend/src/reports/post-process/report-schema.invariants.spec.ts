import '../transferencias/entities/transferencias-csv.entity';
import '../tribunal-de-contas/entities/tribunal-de-contas-csv.entity';

import {
    getReportRowColumns,
    getReportRowSchema,
    getReportRowsOptions,
    listReportRowClasses,
} from './report-column.decorator';

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
