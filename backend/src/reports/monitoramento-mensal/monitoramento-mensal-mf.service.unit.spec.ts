import { MonitoramentoMensalMfService } from './monitoramento-mensal-mf.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MetasAnaliseQualiService } from '../../mf/metas/metas-analise-quali.service';
import { MetasRiscoService } from '../../mf/metas/metas-risco.service';
import { MetasFechamentoService } from '../../mf/metas/metas-fechamento.service';
import { ReportContext } from '../relatorios/helpers/reports.contexto';

// Mock CSV utilities and helpers to be side-effect free and deterministic
jest.mock('../utils/utils.service', () => ({
  DefaultCsvOptions: { delimiter: ',', encoding: 'utf8' },
  DefaultTransforms: [],
}));
jest.mock('src/common/helpers/CsvWriter', () => {
  return {
    // Simulate CSV buffer content deterministic for verification
    WriteCsvToBuffer: jest.fn((rows: any[], _opts: any) => Buffer.from(`rows:${rows.length}`, 'utf8')),
    WriteCsvToFile: jest.fn(async (rows: any[], stream: NodeJS.WritableStream, _opts: any) => {
      // Simulate writing and closing stream
      if (typeof (stream as any).write === 'function') {
        (stream as any).write(`rows:${rows.length}`);
      }
      if (typeof (stream as any).end === 'function') {
        (stream as any).end();
      }
      return;
    }),
  };
});

import { WriteCsvToBuffer, WriteCsvToFile } from 'src/common/helpers/CsvWriter';

// Minimal types to satisfy TS compile within tests
type Pdm = { rotulo_iniciativa: string; rotulo_atividade: string };
type CicloFisico = { id: number; pdm_id: number; data_ciclo: Date };

// Create lightweight fakes/mocks for dependencies
const prismaMock = {
  cicloFisico: {
    findFirst: jest.fn(),
  },
  meta: {
    findMany: jest.fn(),
  },
  $queryRaw: jest.fn(),
} as unknown as jest.Mocked<PrismaService>;

const analiseQualiMock = {
  getMetaAnaliseQualitativa: jest.fn(),
} as unknown as jest.Mocked<MetasAnaliseQualiService>;

const analiseRiscoMock = {
  getMetaRisco: jest.fn(),
} as unknown as jest.Mocked<MetasRiscoService>;

const fechamentoMock = {
  getMetaFechamento: jest.fn(),
} as unknown as jest.Mocked<MetasFechamentoService>;

// Helper to build service
const buildService = () =>
  new MonitoramentoMensalMfService(
    prismaMock as unknown as PrismaService,
    analiseQualiMock as unknown as MetasAnaliseQualiService,
    analiseRiscoMock as unknown as MetasRiscoService,
    fechamentoMock as unknown as MetasFechamentoService
  );

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MonitoramentoMensalMfService - create_mf', () => {
  it('returns null when no ciclo_fisico is found (edge case)', async () => {
    prismaMock.cicloFisico.findFirst = jest.fn().mockResolvedValue(null);

    const service = buildService();
    const dto = { pdm_id: 1, ano: '2023', mes: '02' } as any;
    const result = await service.create_mf(dto, [10, 20]);

    expect(prismaMock.cicloFisico.findFirst).toHaveBeenCalledWith({
      where: {
        pdm_id: dto.pdm_id,
        data_ciclo: new Date([dto.ano, dto.mes, '01'].join('-')),
      },
    });
    expect(result).toBeNull();
  });

  it('returns structured data with month and year from ciclo_fisico and aggregates metas with selective analyses', async () => {
    const cf: CicloFisico = { id: 99, pdm_id: 1, data_ciclo: new Date('2023-02-01') };
    prismaMock.cicloFisico.findFirst = jest.fn().mockResolvedValue(cf);

    // Mock getSeriesVariaveis method itself to isolate create_mf behavior
    const service = buildService();
    const seriesSpy = jest.spyOn(service, 'getSeriesVariaveis').mockResolvedValue([{ variavel_id: 1 } as any]);

    // DB metas
    prismaMock.meta.findMany = jest.fn().mockResolvedValue([
      { id: 10, titulo: 'Meta X', codigo: 'M10' },
      { id: 20, titulo: 'Meta Y', codigo: 'M20' },
    ]);

    // Responses of dependent services:
    // - first meta has quali and risco, but no fechamento
    // - second meta has only fechamento
    analiseQualiMock.getMetaAnaliseQualitativa = jest.fn()
      .mockResolvedValueOnce({ analises: [{ id: 1001, criador: { nome_exibicao: 'A' } }] })
      .mockResolvedValueOnce({ analises: [] });
    analiseRiscoMock.getMetaRisco = jest.fn()
      .mockResolvedValueOnce({ riscos: [{ id: 2001, criador: { nome_exibicao: 'B' } }] })
      .mockResolvedValueOnce({ riscos: [] });
    fechamentoMock.getMetaFechamento = jest.fn()
      .mockResolvedValueOnce({ fechamentos: [] })
      .mockResolvedValueOnce({ fechamentos: [{ id: 3002, criador: { nome_exibicao: 'C' } }] });

    const dto = { pdm_id: 1, ano: '2023', mes: '02' } as any;

    const out = await service.create_mf(dto, [10, 20]);

    expect(seriesSpy).toHaveBeenCalledWith(cf, [10, 20]);
    expect(prismaMock.meta.findMany).toHaveBeenCalledWith({
      where: { id: { in: [10, 20] }, removido_em: null },
      select: { id: true, titulo: true, codigo: true },
    });

    // Check return shape and date extraction
    expect(out).toBeTruthy();
    expect(out?.ano).toBe(2023);
    expect(out?.mes).toBe(1); // getMonth() is zero-based (Feb == 1)
    expect(out?.ciclo_fisico_id).toBe(99);
    expect(out?.seriesVariaveis).toEqual([{ variavel_id: 1 }]);

    // metas aggregation logic
    expect(out?.metas).toHaveLength(2);
    const [m1, m2] = out!.metas;
    expect(m1.meta).toEqual({ id: 10, titulo: 'Meta X', codigo: 'M10' });
    expect(m1.analiseQuali).toEqual({ id: 1001, criador: { nome_exibicao: 'A' } });
    expect(m1.analiseRisco).toEqual({ id: 2001, criador: { nome_exibicao: 'B' } });
    expect(m1.fechamento).toBeNull();

    expect(m2.meta).toEqual({ id: 20, titulo: 'Meta Y', codigo: 'M20' });
    expect(m2.analiseQuali).toBeNull();
    expect(m2.analiseRisco).toBeNull();
    expect(m2.fechamento).toEqual({ id: 3002, criador: { nome_exibicao: 'C' } });

    // Validate params passed to dependent services (Promise.all ordering)
    const expectedParamsMeta10 = { ciclo_fisico_id: 99, meta_id: 10, apenas_ultima_revisao: true };
    const expectedParamsMeta20 = { ciclo_fisico_id: 99, meta_id: 20, apenas_ultima_revisao: true };
    expect(analiseQualiMock.getMetaAnaliseQualitativa).toHaveBeenNthCalledWith(1, expectedParamsMeta10, null, null);
    expect(analiseRiscoMock.getMetaRisco).toHaveBeenNthCalledWith(1, expectedParamsMeta10, null, null);
    expect(fechamentoMock.getMetaFechamento).toHaveBeenNthCalledWith(1, expectedParamsMeta10, null, null);
    expect(analiseQualiMock.getMetaAnaliseQualitativa).toHaveBeenNthCalledWith(2, expectedParamsMeta20, null, null);
    expect(analiseRiscoMock.getMetaRisco).toHaveBeenNthCalledWith(2, expectedParamsMeta20, null, null);
    expect(fechamentoMock.getMetaFechamento).toHaveBeenNthCalledWith(2, expectedParamsMeta20, null, null);
  });
});

describe('MonitoramentoMensalMfService - getSeriesVariaveis', () => {
  it('delegates to prisma.$queryRaw and returns raw results unchanged', async () => {
    const service = buildService();
    const cf: CicloFisico = { id: 7, pdm_id: 1, data_ciclo: new Date('2024-03-01') };
    const metas = [1, 2, 3];

    (prismaMock.$queryRaw as any) = jest.fn().mockResolvedValue([
      {
        serie: 'Realizado',
        variavel_id: 55,
        titulo: 'Var',
        codigo: 'V-001',
        data_valor: '2024-02-01',
        valor_nominal: 12.34,
        conferida: true,
        aguarda_cp: false,
        aguarda_complementacao: false,
        meta_id: 1,
      },
    ]);

    const ret = await service.getSeriesVariaveis(cf as any, metas);

    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
    // We do not assert the full SQL text (unsafe), only that it was called and returned
    expect(ret).toEqual([
      expect.objectContaining({
        serie: 'Realizado',
        variavel_id: 55,
        codigo: 'V-001',
        meta_id: 1,
      }),
    ]);
  });
});

describe('MonitoramentoMensalMfService - getFiles', () => {
  const basePdm: Pdm = { rotulo_iniciativa: 'Iniciativa', rotulo_atividade: 'Atividade' };

  function buildContextWithTmpFile() {
    const chunks: Buffer[] = [];
    const stream = {
      write: (data: any) => { chunks.push(Buffer.from(String(data))); },
      end: () => void 0,
    } as unknown as NodeJS.WritableStream;

    const ctx: Partial<ReportContext> = {
      getTmpFile: jest.fn().mockReturnValue({
        stream,
        path: '/tmp/fake-file.csv',
      }),
    };
    return { ctx: ctx as ReportContext, chunks };
  }

  it('returns empty array when monitoramento_fisico is missing or metas empty', async () => {
    const service = buildService();

    const out1 = await service.getFiles({} as any, basePdm as any, {} as any);
    expect(out1).toEqual([]);

    const out2 = await service.getFiles({ monitoramento_fisico: { metas: [] } } as any, basePdm as any, {} as any);
    expect(out2).toEqual([]);
  });

  it('produces CSV buffers for quali, risco, and fechamento when present, and a file for seriesVariaveis', async () => {
    const service = buildService();

    const metaCommon = { meta: { id: 10, titulo: 'Meta X', codigo: 'M10' } };
    const monitoramento_fisico = {
      metas: [
        {
          ...metaCommon,
          analiseQuali: {
            id: 1,
            criador: { nome_exibicao: 'AutorQ' },
            criado_em: new Date('2024-01-01'),
            informacoes_complementares: 'info',
            referencia_data: new Date('2023-12-01'),
          },
          analiseRisco: {
            id: 2,
            criador: { nome_exibicao: 'AutorR' },
            criado_em: new Date('2024-01-02'),
            ponto_de_atencao: 'ponto',
            detalhamento: 'det',
            referencia_data: new Date('2023-12-02'),
          },
          fechamento: {
            id: 3,
            criador: { nome_exibicao: 'AutorF' },
            criado_em: new Date('2024-01-03'),
            comentario: 'coment',
            referencia_data: new Date('2023-12-03'),
          },
        },
      ],
      seriesVariaveis: [
        {
          serie: 'Realizado',
          variavel_id: 1,
          titulo: 'V1',
          codigo: 'V-1',
          data_valor: '2024-01-01',
          valor_nominal: 9.99,
          atualizado_por: 'User',
          atualizado_em: '2024-01-02',
          conferida: true,
          conferida_em: '2024-01-05',
          conferida_por: 'Supervisor',
          aguarda_cp: false,
          aguarda_complementacao: false,
          meta_id: 10,
          iniciativa_id: 100,
          atividade_id: 1000,
          codigo_meta: 'M10',
          codigo_iniciativa: 'I100',
          codigo_atividade: 'A1000',
          titulo_meta: 'Meta X',
          titulo_iniciativa: 'Ini',
          titulo_atividade: 'Ati',
          analise_qualitativa: 'OK',
        },
      ],
    };

    const myInput = { monitoramento_fisico } as any;
    const { ctx, chunks } = buildContextWithTmpFile();

    const outputs = await service.getFiles(myInput, basePdm as any, ctx);

    // We expect 4 outputs: quali CSV, fechamento CSV, risco CSV, and series-variaveis CSV file
    expect(outputs.map(o => o.name).sort()).toEqual([
      'analises-de-risco.csv',
      'analises-qualitativas.csv',
      'fechamentos.csv',
      'serie-variaveis.csv',
    ]);

    // Buffer-based outputs check the mocked buffer content includes number of rows
    const quali = outputs.find(o => o.name === 'analises-qualitativas.csv')!;
    const risco = outputs.find(o => o.name === 'analises-de-risco.csv')!;
    const fech = outputs.find(o => o.name === 'fechamentos.csv')!;
    expect(quali.buffer?.toString('utf8')).toBe('rows:1');
    expect(risco.buffer?.toString('utf8')).toBe('rows:1');
    expect(fech.buffer?.toString('utf8')).toBe('rows:1');

    // File-based output for seriesVariaveis
    const serie = outputs.find(o => o.name === 'serie-variaveis.csv')!;
    expect(serie.localFile).toBe('/tmp/fake-file.csv');
    expect(WriteCsvToFile).toHaveBeenCalledTimes(1);
    // Ensure fields configuration is passed and contains expected key labels affected by PDM labels
    const writeArgs = (WriteCsvToFile as jest.Mock).mock.calls[0];
    const fields = writeArgs[2]?.fields ?? [];
    // Spot-check a few key fields
    expect(fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ value: 'serie', label: 'Série' }),
      expect.objectContaining({ value: 'variavel_id', label: 'ID da Variável' }),
      expect.objectContaining({ value: 'titulo', label: 'Título' }),
      expect.objectContaining({ value: 'codigo', label: 'Código' }),
      expect.objectContaining({ value: 'data_valor', label: 'Data de Valor' }),
      expect.objectContaining({ value: 'valor_nominal', label: 'Valor Nominal' }),
      // These labels depend on pdm rotulos
      expect.objectContaining({ value: 'iniciativa_id', label: 'ID da Iniciativa' }),
      expect.objectContaining({ value: 'atividade_id', label: 'ID da Atividade' }),
      // Notice the specific keys present in code that may indicate a regression
      expect.objectContaining({ value: 'codigo_iniciativa_codigo', label: 'Código da Iniciativa' }),
      expect.objectContaining({ value: 'codigo_atividade_codigo', label: 'Código da Atividade' }),
    ]));

    // The mocked writer wrote to stream, verify our simulated content was written
    expect(Buffer.concat(chunks).toString('utf8')).toBe('rows:1');
  });

  it('produces fallback text file when there are no seriesVariaveis (edge path)', async () => {
    const service = buildService();
    const myInput = {
      monitoramento_fisico: {
        metas: [
          {
            meta: { id: 10, codigo: 'M10', titulo: 'Meta X' },
            analiseQuali: null,
            analiseRisco: null,
            fechamento: null,
          },
        ],
        seriesVariaveis: [],
      },
    } as any;

    const outputs = await service.getFiles(myInput, basePdm as any, {} as any);

    const serieTxt = outputs.find(o => o.name === 'serie-variaveis.txt')!;
    expect(serieTxt).toBeTruthy();
    expect(serieTxt.buffer?.toString('utf8')).toContain('Não há variáveis no ciclo, serie-variaveis.csv não foi gerado.');
    // No WriteCsvToFile should have been invoked
    expect(WriteCsvToFile).not.toHaveBeenCalled();
  });

  it('skips generating a CSV when a given category has 0 rows (failure/empty conditions)', async () => {
    const service = buildService();
    const myInput = {
      monitoramento_fisico: {
        metas: [
          {
            meta: { id: 1, codigo: 'M1', titulo: 'Meta 1' },
            // All nulls => no quali/risco/fechamento CSVs
            analiseQuali: null,
            analiseRisco: null,
            fechamento: null,
          },
        ],
        // but has series to still generate the series CSV file
        seriesVariaveis: [{ variavel_id: 123 } as any],
      },
    } as any;

    const { ctx } = buildContextWithTmpFile();

    const outputs = await service.getFiles(myInput, basePdm as any, ctx);
    const names = outputs.map(o => o.name);
    expect(names).toContain('serie-variaveis.csv');
    expect(names).not.toContain('analises-qualitativas.csv');
    expect(names).not.toContain('fechamentos.csv');
    expect(names).not.toContain('analises-de-risco.csv');
  });
});