import { BadRequestException } from '@nestjs/common';
import { DuckDBInstance } from '@duckdb/node-api';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { RelatorioModeloConfigDto, RelatorioModeloDirecao, RelatorioModeloFiltroOp } from './dto/relatorio-modelo.dto';
import { compilarFiltros } from './filtro-compiler';
import { ReportPostProcessService } from './report-post-process.service';
import { ReportFileSchema } from './report-schema';

/**
 * Testes de integração do pós-processamento: usam DuckDB de verdade, porque o valor
 * do desenho está justamente em o que o DuckDB faz com os tipos declarados — mockar
 * a engine testaria a nossa montagem de SQL e nada do comportamento que importa.
 */

const SCHEMA: ReportFileSchema = {
    arquivo: 'exemplo.csv',
    colunas: [
        { name: 'id', type: 'BIGINT', label: 'ID', format: { raw: true } },
        { name: 'valor', type: 'DECIMAL(18,2)', label: 'Valor', format: { currency: 'R$', decimalPlaces: 2 } },
        { name: 'vigencia', type: 'DATE', label: 'Vigência' },
        { name: 'dotacao', type: 'VARCHAR', label: 'Dotação', format: { excelTextGuard: true } },
        { name: 'orgao__sigla', type: 'VARCHAR', label: 'Órgão' },
    ],
};

// CSV bruto usa vírgula (delimitador padrão do json2csv); ';' é só na saída.
const CSV_BRUTO = [
    'id,valor,vigencia,dotacao,orgao__sigla',
    '1,1234.56,2024-10-15,2024.10.15.3350,SMUL',
    '2,99.90,2024-01-02,0001.02,SEHAB',
    '3,,,,SMUL',
].join('\n');

function escreverCsvBruto(): string {
    const p = path.join(os.tmpdir(), `spec-raw-${process.pid}-${Math.random().toString(36).slice(2)}.csv`);
    fs.writeFileSync(p, CSV_BRUTO + '\n');
    return p;
}

async function lerXlsx(arquivo: string): Promise<Record<string, unknown>[]> {
    const instance = await DuckDBInstance.create(':memory:');
    const con = await instance.connect();
    try {
        await con.run('LOAD excel');
        const r = await con.run(`SELECT * FROM read_xlsx('${arquivo}', all_varchar = false)`);
        return (await r.getRowObjectsJson()) as Record<string, unknown>[];
    } finally {
        con.disconnectSync();
    }
}

describe('ReportPostProcessService', () => {
    const service = new ReportPostProcessService();
    const criados: string[] = [];

    afterEach(() => {
        for (const f of criados.splice(0)) {
            try {
                fs.unlinkSync(f);
            } catch {
                /* já removido */
            }
        }
    });

    async function aplicar(modelo: RelatorioModeloConfigDto) {
        const bruto = escreverCsvBruto();
        const out = await service.aplicarModelo([{ name: 'exemplo.csv', localFile: bruto }], [SCHEMA], modelo);
        for (const f of out) if (f.localFile) criados.push(f.localFile);

        const csv = out.find((f) => f.name.endsWith('.csv'))!;
        const xlsx = out.find((f) => f.name.endsWith('.xlsx'))!;
        return { out, csvTexto: fs.readFileSync(csv.localFile!, 'utf-8'), xlsxPath: xlsx.localFile! };
    }

    it('emite CSV e XLSX a partir do mesmo CSV bruto', async () => {
        const { out } = await aplicar({ arquivos: [{ arquivo: 'exemplo.csv' }] });

        expect(out.map((f) => f.name)).toEqual(['exemplo.csv', 'exemplo.xlsx']);
    });

    it('aplica labels e formatação pt-BR no CSV', async () => {
        const { csvTexto } = await aplicar({ arquivos: [{ arquivo: 'exemplo.csv' }] });
        const linhas = csvTexto.trim().split('\n');

        expect(linhas[0]).toBe('ID;Valor;Vigência;Dotação;Órgão');
        expect(linhas[1]).toContain('R$');
        expect(linhas[1]).toContain('1.234,56');
        expect(linhas[1]).toContain('15/10/2024');

        // Comportamento atual da lib (duckdb-report-builder 0.3.1): CONCAT ignora NULL,
        // então valor nulo com prefixo de moeda sai como "R$ " em vez de vazio.
        // TODO: corrigir na lib (currency/unit null-safe) e inverter esta asserção.
        expect(linhas[3]).toContain('R$ ;');
    });

    it('protege texto no CSV com o guard e NÃO no XLSX', async () => {
        const { csvTexto, xlsxPath } = await aplicar({ arquivos: [{ arquivo: 'exemplo.csv' }] });

        // No CSV, sem schema, o Excel reinterpretaria 2024.10.15.3350 — daí o guard.
        // O campo contém aspas, então o writer CSV o envolve em aspas e as dobra
        // (`"=""..."""`), que é como o Excel espera receber `="..."`.
        expect(csvTexto).toContain('"=""2024.10.15.3350"""');
        expect(csvTexto).toContain('"=""0001.02"""');

        // No XLSX a célula já nasce texto; o guard seria ruído visível.
        const linhas = await lerXlsx(xlsxPath);
        expect(linhas[0]['Dotação']).toBe('2024.10.15.3350');
        expect(linhas[1]['Dotação']).toBe('0001.02');
        expect(JSON.stringify(linhas)).not.toContain('="');
    });

    it('mantém tipos nativos no XLSX (valor somável, data como data)', async () => {
        const { xlsxPath } = await aplicar({ arquivos: [{ arquivo: 'exemplo.csv' }] });
        const linhas = await lerXlsx(xlsxPath);

        expect(linhas[0]['Valor']).toBe(1234.56);
        expect(typeof linhas[0]['Valor']).toBe('number');
        expect(String(linhas[0]['Vigência'])).toContain('2024-10-15');
    });

    it('seleciona, reordena e renomeia colunas conforme o modelo', async () => {
        const { csvTexto } = await aplicar({
            arquivos: [
                {
                    arquivo: 'exemplo.csv',
                    colunas: [{ coluna: 'orgao__sigla', label: 'Secretaria' }, { coluna: 'id' }],
                },
            ],
        });

        expect(csvTexto.trim().split('\n')[0]).toBe('Secretaria;ID');
    });

    it('filtra e ordena no pós-processamento', async () => {
        const { csvTexto } = await aplicar({
            arquivos: [
                {
                    arquivo: 'exemplo.csv',
                    colunas: [{ coluna: 'id' }],
                    filtros: [{ coluna: 'orgao__sigla', op: RelatorioModeloFiltroOp.eq, valor: 'SMUL' }],
                    order_by: [{ coluna: 'id', direcao: RelatorioModeloDirecao.DESC }],
                },
            ],
        });

        expect(csvTexto.trim().split('\n')).toEqual(['ID', '3', '1']);
    });

    it('preserva a precisão de DECIMAL (read_csv_auto inferiria DOUBLE)', async () => {
        const bruto = path.join(os.tmpdir(), `spec-dec-${process.pid}.csv`);
        criados.push(bruto);
        fs.writeFileSync(bruto, 'id,valor,vigencia,dotacao,orgao__sigla\n1,0.10,2024-01-01,x,Y\n');

        const out = await service.aplicarModelo(
            [{ name: 'exemplo.csv', localFile: bruto }],
            [SCHEMA],
            { arquivos: [{ arquivo: 'exemplo.csv', colunas: [{ coluna: 'valor' }] }] }
        );
        for (const f of out) if (f.localFile) criados.push(f.localFile);

        const linhas = await lerXlsx(out.find((f) => f.name.endsWith('.xlsx'))!.localFile!);
        expect(linhas[0]['Valor']).toBe(0.1);
    });

    it('devolve intactos os arquivos sem schema declarado', async () => {
        const bruto = escreverCsvBruto();
        criados.push(bruto);

        const out = await service.aplicarModelo([{ name: 'outro.csv', localFile: bruto }], [SCHEMA], {
            arquivos: [{ arquivo: 'exemplo.csv' }],
        });

        expect(out).toEqual([{ name: 'outro.csv', localFile: bruto }]);
    });

    it('respeita xlsx_tipado: false espelhando a apresentação do CSV', async () => {
        const { xlsxPath } = await aplicar({ arquivos: [{ arquivo: 'exemplo.csv' }], xlsx_tipado: false });
        const linhas = await lerXlsx(xlsxPath);

        expect(String(linhas[0]['Valor'])).toContain('1.234,56');
    });
});

describe('compilarFiltros', () => {
    const colunas = SCHEMA.colunas;

    it('rejeita coluna inexistente', () => {
        expect(() =>
            compilarFiltros([{ coluna: 'nao_existe', op: RelatorioModeloFiltroOp.eq, valor: 1 }], colunas)
        ).toThrow(BadRequestException);
    });

    it('não interpola SQL vindo do valor', () => {
        const [sql] = compilarFiltros(
            [{ coluna: 'orgao__sigla', op: RelatorioModeloFiltroOp.eq, valor: "x'; DROP TABLE raw; --" }],
            colunas
        );

        expect(sql).toBe(`"orgao__sigla" = 'x''; DROP TABLE raw; --'`);
    });

    it('valida tipo numérico', () => {
        expect(() => compilarFiltros([{ coluna: 'id', op: RelatorioModeloFiltroOp.eq, valor: 'abc' }], colunas)).toThrow(
            BadRequestException
        );
    });

    it('valida data ISO', () => {
        expect(() =>
            compilarFiltros([{ coluna: 'vigencia', op: RelatorioModeloFiltroOp.gte, valor: '15/10/2024' }], colunas)
        ).toThrow(BadRequestException);
    });

    it('escapa curingas de LIKE informados pelo usuário', () => {
        const [sql] = compilarFiltros(
            [{ coluna: 'dotacao', op: RelatorioModeloFiltroOp.contains, valor: '100%_x' }],
            colunas
        );

        expect(sql).toContain(`'%100\\%\\_x%'`);
    });

    it('rejeita lista vazia no operador in', () => {
        expect(() =>
            compilarFiltros([{ coluna: 'id', op: RelatorioModeloFiltroOp.in, valores: [] }], colunas)
        ).toThrow(BadRequestException);
    });
});
