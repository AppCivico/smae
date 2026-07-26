import { BadRequestException } from '@nestjs/common';
import { DuckDBInstance } from '@duckdb/node-api';
import { FonteRelatorio } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { CreateRelatorioModeloDto } from '../relatorio-modelo/dto/create-relatorio-modelo.dto';
import { RelatorioModeloConfigDto, RelatorioModeloDirecao, RelatorioModeloFiltroOp } from './dto/relatorio-modelo.dto';
import { compilarFiltros } from './filtro-compiler';
import { modeloPadraoDeSchemas, ReportPostProcessService } from './report-post-process.service';
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

async function lerXlsx(arquivo: string, aba?: string): Promise<Record<string, unknown>[]> {
    const instance = await DuckDBInstance.create(':memory:');
    const con = await instance.connect();
    try {
        // INSTALL + LOAD: sem o INSTALL o teste só passa em máquina cujo cache de extensão
        // já foi populado para esta versão exata do DuckDB.
        await con.run('INSTALL excel');
        await con.run('LOAD excel');
        const sheet = aba ? `, sheet = '${aba}'` : '';
        const r = await con.run(`SELECT * FROM read_xlsx('${arquivo}', all_varchar = false${sheet})`);
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
        const { arquivos: out, ignoradas } = await service.aplicarModelo(
            [{ name: 'exemplo.csv', localFile: bruto }],
            [SCHEMA],
            modelo
        );
        for (const f of out) if (f.localFile) criados.push(f.localFile);

        const csv = out.find((f) => f.name.endsWith('.csv'))!;
        const xlsx = out.find((f) => f.name.endsWith('.xlsx'))!;
        return { out, ignoradas, csvTexto: fs.readFileSync(csv.localFile!, 'utf-8'), xlsxPath: xlsx.localFile! };
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

        // Célula numérica vazia com prefixo de moeda sai vazia, não como a string "R$ ".
        // (a lib usava CONCAT, que ignora NULL; desde a 0.4.0 usa `||`, que propaga)
        // O `""` é a Dotação: o guard devolve string vazia para NULL, e o writer de CSV
        // do DuckDB a escreve entre aspas para distingui-la de NULL (que sai como nada).
        expect(linhas[3]).toBe('3;;;"";SMUL');
        expect(linhas[3]).not.toContain('R$');
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

    it('nomeia a aba do XLSX com o nome do relatório', async () => {
        const { xlsxPath } = await aplicar({ arquivos: [{ arquivo: 'exemplo.csv' }] });

        // Ler pelo nome só funciona se o SHEET foi aplicado — o default do DuckDB é 'Sheet1'.
        expect(await lerXlsx(xlsxPath, 'exemplo')).toHaveLength(3);
        await expect(lerXlsx(xlsxPath, 'Sheet1')).rejects.toThrow();
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

        const { arquivos: out } = await service.aplicarModelo([{ name: 'exemplo.csv', localFile: bruto }], [SCHEMA], {
            arquivos: [{ arquivo: 'exemplo.csv', colunas: [{ coluna: 'valor' }] }],
        });
        for (const f of out) if (f.localFile) criados.push(f.localFile);

        const linhas = await lerXlsx(out.find((f) => f.name.endsWith('.xlsx'))!.localFile!);
        expect(linhas[0]['Valor']).toBe(0.1);
    });

    it('devolve intactos os arquivos sem schema declarado', async () => {
        const bruto = escreverCsvBruto();
        criados.push(bruto);

        const { arquivos: out } = await service.aplicarModelo([{ name: 'outro.csv', localFile: bruto }], [SCHEMA], {
            arquivos: [{ arquivo: 'exemplo.csv' }],
        });

        expect(out).toEqual([{ name: 'outro.csv', localFile: bruto }]);
    });

    it('respeita xlsx_tipado: false espelhando a apresentação do CSV', async () => {
        const { xlsxPath } = await aplicar({ arquivos: [{ arquivo: 'exemplo.csv' }], xlsx_tipado: false });
        const linhas = await lerXlsx(xlsxPath);

        expect(String(linhas[0]['Valor'])).toContain('1.234,56');
    });

    /**
     * O modelo padrão é o que segura a saída dos relatórios sem `modelo_id`: como a extração
     * dessas fontes passou a emitir CSV cru, sem ele o usuário receberia cabeçalho técnico e
     * valores sem máscara — pior que antes do schema existir.
     */
    it('modelo padrão reproduz labels e formatação do schema', async () => {
        const padrao = modeloPadraoDeSchemas([SCHEMA]);

        expect(padrao).toEqual({ arquivos: [{ arquivo: 'exemplo.csv' }] });

        const { csvTexto } = await aplicar(padrao);
        const linhas = csvTexto.trim().split('\n');

        // Cabeçalho humano (não `id;valor;vigencia;...`) e formatação pt-BR completa.
        expect(linhas[0]).toBe('ID;Valor;Vigência;Dotação;Órgão');
        expect(linhas[1]).toContain('1.234,56');
        expect(linhas[1]).toContain('15/10/2024');
        expect(csvTexto).toContain('"=""2024.10.15.3350"""');
    });

    it('ordena por vários campos, na ordem declarada', async () => {
        const { csvTexto } = await aplicar({
            arquivos: [
                {
                    arquivo: 'exemplo.csv',
                    colunas: [{ coluna: 'orgao__sigla' }, { coluna: 'id' }],
                    order_by: [
                        { coluna: 'orgao__sigla', direcao: RelatorioModeloDirecao.ASC },
                        { coluna: 'id', direcao: RelatorioModeloDirecao.DESC },
                    ],
                },
            ],
        });

        // SEHAB antes de SMUL; dentro de SMUL, id decrescente (3 antes de 1).
        expect(csvTexto.trim().split('\n')).toEqual(['Órgão;ID', 'SEHAB;2', 'SMUL;3', 'SMUL;1']);
    });

    describe('tolerância a schema que mudou depois do modelo salvo', () => {
        it('coluna que não existe mais sai como NULL, sem derrubar o relatório', async () => {
            const { csvTexto, ignoradas } = await aplicar({
                arquivos: [
                    {
                        arquivo: 'exemplo.csv',
                        colunas: [{ coluna: 'id' }, { coluna: 'coluna_removida' }, { coluna: 'orgao__sigla' }],
                    },
                ],
            });

            const linhas = csvTexto.trim().split('\n');
            // A coluna continua na posição pedida, com o nome como cabeçalho, e vazia.
            expect(linhas[0]).toBe('ID;coluna_removida;Órgão');
            expect(linhas[1]).toBe('1;;SMUL');
            expect(ignoradas).toEqual([{ arquivo: 'exemplo.csv', onde: 'colunas', coluna: 'coluna_removida' }]);
        });

        it('respeita o label do modelo na coluna ausente', async () => {
            const { csvTexto } = await aplicar({
                arquivos: [
                    { arquivo: 'exemplo.csv', colunas: [{ coluna: 'sumiu', label: 'Campo Antigo' }, { coluna: 'id' }] },
                ],
            });

            expect(csvTexto.trim().split('\n')[0]).toBe('Campo Antigo;ID');
        });

        it('descarta filtro sobre coluna ausente em vez de zerar o relatório', async () => {
            const { csvTexto, ignoradas } = await aplicar({
                arquivos: [
                    {
                        arquivo: 'exemplo.csv',
                        colunas: [{ coluna: 'id' }],
                        filtros: [{ coluna: 'sumiu', op: RelatorioModeloFiltroOp.eq, valor: 'x' }],
                    },
                ],
            });

            // As 3 linhas seguem: filtrar por NULL devolveria zero linhas.
            expect(csvTexto.trim().split('\n')).toHaveLength(4);
            expect(ignoradas).toEqual([{ arquivo: 'exemplo.csv', onde: 'filtros', coluna: 'sumiu' }]);
        });

        it('descarta order_by sobre coluna ausente', async () => {
            const { ignoradas } = await aplicar({
                arquivos: [
                    {
                        arquivo: 'exemplo.csv',
                        order_by: [{ coluna: 'sumiu', direcao: RelatorioModeloDirecao.ASC }],
                    },
                ],
            });

            expect(ignoradas).toEqual([{ arquivo: 'exemplo.csv', onde: 'order_by', coluna: 'sumiu' }]);
        });
    });

    /**
     * O `quoteIdentifier`/`strftime` da lib não escapam o que recebem, então tudo que vem do
     * modelo e chega perto de SQL é conferido ou escapado do nosso lado. Estes testes existem
     * para essas três portas não reabrirem silenciosamente.
     */
    describe('nada vindo do modelo escapa para SQL', () => {
        it('order_by não escapa do identificador (é descartado, não interpolado)', async () => {
            const { csvTexto, ignoradas } = await aplicar({
                arquivos: [
                    {
                        arquivo: 'exemplo.csv',
                        colunas: [{ coluna: 'id' }],
                        order_by: [{ coluna: 'id" DESC, (SELECT 1) --', direcao: RelatorioModeloDirecao.ASC }],
                    },
                ],
            });

            expect(ignoradas.map((i) => i.onde)).toEqual(['order_by']);
            expect(csvTexto.trim().split('\n')).toEqual(['ID', '1', '2', '3']);
        });

        it('label não cria coluna extra via rename', async () => {
            const { csvTexto } = await aplicar({
                arquivos: [{ arquivo: 'exemplo.csv', colunas: [{ coluna: 'id', label: 'X" , 999 AS "PWNED' }] }],
            });

            const linhas = csvTexto.trim().split('\n');

            // O label virou UM cabeçalho só, escapado — não uma segunda coluna com SQL.
            // (o `999` aparece dentro do texto do label, e isso é inofensivo: é só rótulo)
            expect(linhas[0]).toBe('"X"" , 999 AS ""PWNED"');
            // O que provaria injeção seria a expressão ter sido avaliada numa coluna extra:
            // as linhas de dados têm um único campo, com o valor real de `id`.
            expect(linhas.slice(1)).toEqual(['1', '2', '3']);
        });

        it('formato_data não escapa do literal de strftime', async () => {
            const { csvTexto } = await aplicar({
                arquivos: [
                    {
                        arquivo: 'exemplo.csv',
                        colunas: [{ coluna: 'vigencia', formato_data: "%Y') || 'VAZOU' || strftime(vigencia, '%m" }],
                    },
                ],
            });

            // Se o `'` tivesse escapado do literal, o `||` seria avaliado e sairia `2024VAZOU10`.
            // Escapado, o formato inteiro é tratado como texto: `%Y`/`%m` expandem e o resto
            // sai literal. Feio, mas é o formato que o usuário pediu — e nenhum SQL rodou.
            expect(csvTexto).not.toContain('2024VAZOU10');
            expect(csvTexto).toContain("2024') || 'VAZOU'");
        });
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
        expect(() =>
            compilarFiltros([{ coluna: 'id', op: RelatorioModeloFiltroOp.eq, valor: 'abc' }], colunas)
        ).toThrow(BadRequestException);
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
        expect(() => compilarFiltros([{ coluna: 'id', op: RelatorioModeloFiltroOp.in, valores: [] }], colunas)).toThrow(
            BadRequestException
        );
    });

    /**
     * A tolerância é opt-in para que a validação de criação/edição do modelo continue estrita:
     * lá, coluna inexistente é erro de digitação e tem que aparecer como 400.
     */
    it('só ignora coluna ausente quando o callback é passado', () => {
        const filtros = [
            { coluna: 'sumiu', op: RelatorioModeloFiltroOp.eq, valor: 'x' },
            { coluna: 'id', op: RelatorioModeloFiltroOp.eq, valor: 1 },
        ];

        expect(() => compilarFiltros(filtros, colunas)).toThrow(BadRequestException);

        const ausentes: string[] = [];
        expect(compilarFiltros(filtros, colunas, (c) => ausentes.push(c))).toEqual(['"id" = 1']);
        expect(ausentes).toEqual(['sumiu']);
    });
});

/**
 * Validação de DTO, não de SQL: o objetivo é o pedido malformado morrer no 400 do
 * ValidationPipe, antes de `validaConfig`/`compilarFiltros` verem qualquer coisa.
 */
describe('validação dos DTOs de modelo', () => {
    async function erros(dto: object): Promise<string[]> {
        const instancia = plainToInstance(CreateRelatorioModeloDto, dto);
        const falhas = await validate(instancia, { whitelist: true });
        // Achata as falhas aninhadas (config -> arquivos -> filtros) numa lista de propriedades.
        const nomes: string[] = [];
        const visita = (fs: ValidationError[]) => {
            for (const f of fs) {
                if (f.constraints) nomes.push(f.property);
                if (f.children?.length) visita(f.children);
            }
        };
        visita(falhas);
        return nomes;
    }

    const base = {
        fonte: FonteRelatorio.Transferencias,
        config: { arquivos: [{ arquivo: 'transferencias.csv' }] },
    };

    it('aceita um DTO mínimo válido', async () => {
        expect(await erros({ ...base, nome: 'Modelo' })).toEqual([]);
    });

    it('rejeita nome vazio ou só de espaços', async () => {
        expect(await erros({ ...base, nome: '' })).toContain('nome');
        expect(await erros({ ...base, nome: '   ' })).toContain('nome');
    });

    it('rejeita config ausente em vez de estourar no service', async () => {
        expect(await erros({ nome: 'Modelo', fonte: FonteRelatorio.Transferencias })).toContain('config');
    });

    it('exige valor nos operadores escalares', async () => {
        const dto = {
            ...base,
            nome: 'Modelo',
            config: {
                arquivos: [
                    {
                        arquivo: 'transferencias.csv',
                        filtros: [{ coluna: 'valor', op: RelatorioModeloFiltroOp.eq }],
                    },
                ],
            },
        };

        expect(await erros(dto)).toContain('valor');
    });

    it('não exige valor em is_null / is_not_null', async () => {
        for (const op of [RelatorioModeloFiltroOp.is_null, RelatorioModeloFiltroOp.is_not_null]) {
            const dto = {
                ...base,
                nome: 'Modelo',
                config: {
                    arquivos: [{ arquivo: 'transferencias.csv', filtros: [{ coluna: 'valor', op }] }],
                },
            };

            expect(await erros(dto)).toEqual([]);
        }
    });

    it('exige valores não-vazio no operador in', async () => {
        const comLista = (valores: unknown[] | undefined) => ({
            ...base,
            nome: 'Modelo',
            config: {
                arquivos: [
                    {
                        arquivo: 'transferencias.csv',
                        filtros: [{ coluna: 'id', op: RelatorioModeloFiltroOp.in, valores }],
                    },
                ],
            },
        });

        expect(await erros(comLista([]))).toContain('valores');
        expect(await erros(comLista(undefined))).toContain('valores');
        expect(await erros(comLista([1, 2]))).toEqual([]);
    });
});
