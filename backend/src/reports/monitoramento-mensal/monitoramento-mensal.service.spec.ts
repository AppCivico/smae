import { Test, TestingModule } from '@nestjs/testing';
import { MonitoramentoMensalService } from './monitoramento-mensal.service';
import { UtilsService, FileOutput } from '../utils/utils.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PainelService } from '../../painel/painel.service';
import { MonitoramentoMensalMfService } from './monitoramento-mensal-mf.service';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { ReportContext } from '../relatorios/helpers/reports.contexto';
import { CreateRelMonitoramentoMensalDto } from './dto/create-monitoramento-mensal.dto';

// We need to mock WriteCsvToFile and any transforms/defaults used under the hood
// Since WriteCsvToFile is imported in the service file via: src/common/helpers/CsvWriter,
// we will mock the entire module to avoid actual file IO.
jest.mock('src/common/helpers/CsvWriter', () => ({
  WriteCsvToFile: jest.fn().mockResolvedValue(undefined),
}));

// The service also imports DefaultCsvOptions and DefaultTransforms from UtilsService.
// Those are values (not functions) used to pass to Csv writer; we can just keep them as dumb objects in our test.
const DefaultCsvOptionsMock = { delimiter: ',', withBOM: true };
const DefaultTransformsMock = [];

describe('MonitoramentoMensalService', () => {
  let service: MonitoramentoMensalService;

  // Mocks
  const utilsMock = {
    applyFilter: jest.fn(),
  } as unknown as jest.Mocked<UtilsService>;

  const prismaMock = {
    pdm: {
      findUniqueOrThrow: jest.fn(),
    },
  } as unknown as jest.Mocked<PrismaService>;

  const painelMock = {
    getPainelShortData: jest.fn(),
    getSimplifiedPainelSeries: jest.fn(),
  } as unknown as jest.Mocked<PainelService>;

  const mmMfMock = {
    create_mf: jest.fn(),
    getFiles: jest.fn(),
  } as unknown as jest.Mocked<MonitoramentoMensalMfService>;

  // Simple ReportContext test double
  const progressSpy = jest.fn().mockResolvedValue(undefined);
  const resumoSaidaSpy = jest.fn();
  const tmpFile = { stream: { write: jest.fn(), end: jest.fn() }, path: '/tmp/fake.csv' };
  const getTmpFileSpy = jest.fn().mockReturnValue(tmpFile);

  const ctxMock: ReportContext = {
    progress: progressSpy,
    resumoSaida: resumoSaidaSpy,
    getTmpFile: getTmpFileSpy,
  } as any;

  // Helper factories
  const makeDto = (overrides: Partial<CreateRelMonitoramentoMensalDto> = {}): CreateRelMonitoramentoMensalDto => ({
    pdm_id: 1,
    paineis: [10, 20],
    ...overrides,
  }) as any;

  const user: PessoaFromJwt | null = { id: 123 } as any;

  beforeEach(async () => {
    jest.resetAllMocks();

    // Provide default constants for UtilsService values if referenced indirectly
    // We patch the module instance to avoid import-time coupling.
    // Note: MonitoramentoMensalService imports these constants; tests won't reference them directly.

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitoramentoMensalService,
        { provide: UtilsService, useValue: utilsMock },
        { provide: PrismaService, useValue: prismaMock },
        { provide: PainelService, useValue: painelMock },
        { provide: MonitoramentoMensalMfService, useValue: mmMfMock },
      ],
    }).compile();

    service = module.get(MonitoramentoMensalService);

    // Default mock implementations
    utilsMock.applyFilter = jest.fn().mockResolvedValue({
      metas: [{ id: 1 }, { id: 2 }, { id: 3 }],
    });

    prismaMock.pdm.findUniqueOrThrow = jest.fn().mockResolvedValue({
      id: 1,
      nome: 'PDM',
      rotulo_iniciativa: 'Iniciativa',
      rotulo_atividade: 'Atividade',
    });

    painelMock.getPainelShortData = jest.fn()
      // For painel 10
      .mockResolvedValueOnce({ id: 10, nome: 'Painel Dez', periodicidade: 'MENSAL' })
      // For painel 20
      .mockResolvedValueOnce({ id: 20, nome: 'Painel Vinte', periodicidade: 'TRIMESTRAL' });

    // By default return series for runPainelReport
    // getSimplifiedPainelSeries consumed by private runPainelReport
    painelMock.getSimplifiedPainelSeries = jest.fn().mockResolvedValue([
      {
        meta_id: 1,
        meta_codigo: 'M-1',
        meta_titulo: 'Meta 1',
        iniciativa_id: 100,
        iniciativa_codigo: 'I-100',
        atividade_id: 200,
        atividade_codigo: 'A-200',
        atividade_titulo: 'Atv 200',
        indicador_id: 900,
        indicador_titulo: 'Indicador 9',
        indicador_codigo: 'IND-9',
        variavel_id: 300,
        variavel_codigo: 'VAR-300',
        variavel_titulo: 'Variável 300',
        series: [
          {
            data: '2025-01-01',
            Previsto: 10,
            PrevistoAcumulado: 15,
            Realizado: 12,
            RealizadoAcumulado: 17,
          },
          {
            // This one should be skipped (all falsy)
            data: '2025-02-01',
            Previsto: null,
            PrevistoAcumulado: null,
            Realizado: null,
            RealizadoAcumulado: null,
          },
          {
            data: '2025-03-01',
            Previsto: 0,
            PrevistoAcumulado: 0,
            Realizado: 0,
            RealizadoAcumulado: 0,
          },
        ],
      },
      {
        // Should be skipped entirely if series is empty/undefined
        meta_id: 2,
        meta_codigo: 'M-2',
        meta_titulo: 'Meta 2',
        iniciativa_id: 101,
        iniciativa_codigo: 'I-101',
        atividade_id: 201,
        atividade_codigo: 'A-201',
        atividade_titulo: 'Atv 201',
        indicador_id: 901,
        indicador_titulo: 'Indicador 10',
        indicador_codigo: 'IND-10',
        variavel_id: 301,
        variavel_codigo: 'VAR-301',
        variavel_titulo: 'Variável 301',
        series: undefined,
      },
    ]);

    mmMfMock.create_mf = jest.fn().mockResolvedValue({
      seriesVariaveis: [{ id: 'sv1' }],
    });

    mmMfMock.getFiles = jest.fn().mockResolvedValue([
      { name: 'mf-1.csv', localFile: '/tmp/mf-1.csv' },
    ]);
  });

  describe('asJSON', () => {
    it('returns monitoramento_fisico and paineis with aggregated linhas (happy path)', async () => {
      const dto = makeDto();
      const result = await service.asJSON(dto, user);

      expect(utilsMock.applyFilter).toHaveBeenCalledWith(
        expect.objectContaining({ paineis: [10, 20] }),
        { iniciativas: false, atividades: false },
        user
      );

      // Ensures mmMf is called with the metas array
      expect(mmMfMock.create_mf).toHaveBeenCalledWith(expect.any(Object), [1, 2, 3]);

      // Painel short data called for each painel
      expect(painelMock.getPainelShortData).toHaveBeenCalledTimes(2);
      expect(painelMock.getSimplifiedPainelSeries).toHaveBeenCalledTimes(2);

      // The "linhas" are derived from runPainelReport
      expect(result.paineis.length).toBe(2);
      for (const p of result.paineis) {
        expect(p.painel).toEqual(expect.objectContaining({ id: expect.any(Number) }));
        expect(p.linhas.length).toBeGreaterThan(0);
        for (const linha of p.linhas) {
          expect(linha).toEqual(
            expect.objectContaining({
              meta_id: expect.any(Number),
              variavel_id: expect.any(Number),
              data: expect.any(String),
            })
          );
        }
      }

      expect(result.monitoramento_fisico).toEqual(expect.objectContaining({ seriesVariaveis: expect.any(Array) }));
    });

    it('skips paineis with no data returned by getPainelShortData', async () => {
      // First painel is null, second painel returns valid data
      painelMock.getPainelShortData = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 20, nome: 'Painel Vinte', periodicidade: 'TRIMESTRAL' });

      const dto = makeDto();
      const result = await service.asJSON(dto, user);

      expect(result.paineis.length).toBe(1);
      expect(result.paineis[0].painel.id).toBe(20);
    });

    it('throws if metas exceed 10000 to avoid OOM', async () => {
      const many = Array.from({ length: 10001 }, (_, i) => ({ id: i + 1 }));
      utilsMock.applyFilter = jest.fn().mockResolvedValue({ metas: many });

      await expect(service.asJSON(makeDto(), user)).rejects.toThrow(
        /Mais de 10000 indicadores encontrados/
      );
    });

    it('handles empty or non-array dto.paineis by normalizing to []', async () => {
      painelMock.getPainelShortData = jest.fn(); // ensure not called
      const dto = makeDto({ paineis: null as any });
      await service.asJSON(dto, user);
      expect(painelMock.getPainelShortData).not.toHaveBeenCalled();
    });
  });

  describe('toFileOutput', () => {
    it('produces files for mf and for each painel with linhas, including CSV file via WriteCsvToFile', async () => {
      // Arrange: second painel returns no linhas by making runPainelReport return lines for first only.
      // We cannot call private method directly; we control via getSimplifiedPainelSeries mock behavior sequence.
      // For first painel id (10) we return lines (as set in beforeEach).
      // For second (20), override to return empty lines
      (painelMock.getSimplifiedPainelSeries as jest.Mock)
        .mockResolvedValueOnce([
          {
            meta_id: 1,
            meta_codigo: 'M-1',
            meta_titulo: 'Meta 1',
            iniciativa_id: 100,
            iniciativa_codigo: 'I-100',
            atividade_id: 200,
            atividade_codigo: 'A-200',
            atividade_titulo: 'Atv 200',
            indicador_id: 900,
            indicador_titulo: 'Indicador 9',
            indicador_codigo: 'IND-9',
            variavel_id: 300,
            variavel_codigo: 'VAR-300',
            variavel_titulo: 'Variável 300',
            series: [
              {
                data: '2025-01-01',
                Previsto: 10,
                PrevistoAcumulado: 15,
                Realizado: 12,
                RealizadoAcumulado: 17,
              },
            ],
          },
        ])
        .mockResolvedValueOnce([]); // second painel: no linhas

      const dto = makeDto();
      const out = await service.toFileOutput(dto, ctxMock, user);

      // Should call prisma to get pdm info used in CSV headers and file naming
      expect(prismaMock.pdm.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: dto.pdm_id } });

      // mmMf.create_mf called once and getFiles used to get MF files
      expect(mmMfMock.create_mf).toHaveBeenCalledTimes(1);
      expect(mmMfMock.getFiles).toHaveBeenCalledTimes(2); // one for MF, one for painel block with linhas

      // CSV output should be added for painel with linhas
      expect(getTmpFileSpy).toHaveBeenCalledTimes(1);
      // info.json always present + mf files + painel files + painel CSV file
      const names = out.map((f) => f.name);
      expect(names).toContain('info.json');
      expect(names).toContain('mf-1.csv');

      // CSV filename pattern: painel-<sanitized-nome>.<id>.<periodicidade>.csv
      const csvNames = names.filter((n) => n.startsWith('painel-') && n.endsWith('.csv'));
      expect(csvNames.length).toBe(1);
      expect(csvNames[0]).toMatch(/painel-Painel-Dez\.10\.MENSAL\.csv/);

      // Validate info.json content structure
      const infoJson = out.find((f) => f.name === 'info.json');
      expect(infoJson).toBeDefined();
      expect(infoJson!.buffer).toBeInstanceOf(Buffer);
      const parsed = JSON.parse(infoJson!.buffer.toString('utf8'));
      expect(parsed).toHaveProperty('params');
      expect(parsed).toHaveProperty('horario');

      // Progress updates
      expect(progressSpy).toHaveBeenCalled();
      // We expect at least the initial, mid, and final progress calls
      // Final is 99 as per implementation
      const lastProgress = progressSpy.mock.calls[progressSpy.mock.calls.length - 1][0];
      expect(Math.round(lastProgress)).toBe(99);
    });

    it('skips adding painel files when getPainelShortData returns null', async () => {
      painelMock.getPainelShortData = jest.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const out = await service.toFileOutput(makeDto(), ctxMock, user);

      const names = out.map((f) => f.name);
      // Still should include info.json and MF files
      expect(names).toContain('info.json');
      expect(names).toContain('mf-1.csv');
      // No painel CSVs since none returned
      const painelCsvs = names.filter((n) => n.startsWith('painel-') && n.endsWith('.csv'));
      expect(painelCsvs.length).toBe(0);
    });

    it('normalizes paineis to [] when not an array, and still returns info.json and MF files', async () => {
      const dto = makeDto({ paineis: undefined as any });
      const out = await service.toFileOutput(dto, ctxMock, user);

      expect(painelMock.getPainelShortData).not.toHaveBeenCalled();

      const names = out.map((f) => f.name);
      expect(names).toContain('info.json');
      expect(names).toContain('mf-1.csv');
    });

    it('handles when runPainelReport returns linhas but WriteCsvToFile is invoked correctly', async () => {
      const { WriteCsvToFile } = jest.requireMock('src/common/helpers/CsvWriter') as {
        WriteCsvToFile: jest.Mock;
      };

      const out = await service.toFileOutput(makeDto(), ctxMock, user);
      expect(WriteCsvToFile).toHaveBeenCalled();
      // Expect it's called with array of linhas, tmp stream, options
      const csvCall = (WriteCsvToFile as jest.Mock).mock.calls.find(Boolean);
      expect(csvCall?.[0]).toBeInstanceOf(Array);
      expect(csvCall?.[1]).toEqual(tmpFile.stream);
      expect(csvCall?.[2]).toEqual(
        expect.objectContaining({
          csvOptions: expect.any(Object),
          transforms: expect.any(Array),
          fields: expect.any(Array),
        })
      );
    });
  });

  describe('edge cases for runPainelReport through toFileOutput pipeline', () => {
    it('filters out series with all null/undefined values and includes zero values', async () => {
      // Configure getSimplifiedPainelSeries for one painel with both empty and zero-valued series within the response
      (painelMock.getSimplifiedPainelSeries as jest.Mock).mockResolvedValueOnce([
        {
          meta_id: 1,
          meta_codigo: 'M-1',
          meta_titulo: 'Meta 1',
          iniciativa_id: 100,
          iniciativa_codigo: 'I-100',
          atividade_id: 200,
          atividade_codigo: 'A-200',
          atividade_titulo: 'Atv 200',
          indicador_id: 900,
          indicador_titulo: 'Indicador 9',
          indicador_codigo: 'IND-9',
          variavel_id: 300,
          variavel_codigo: 'VAR-300',
          variavel_titulo: 'Variável 300',
          series: [
            {
              data: '2025-01-01',
              Previsto: null,
              PrevistoAcumulado: null,
              Realizado: null,
              RealizadoAcumulado: null,
            },
            {
              data: '2025-02-01',
              Previsto: 0,
              PrevistoAcumulado: 0,
              Realizado: 0,
              RealizadoAcumulado: 0,
            },
          ],
        },
      ]);

      // Second painel omitted
      painelMock.getPainelShortData = jest.fn().mockResolvedValueOnce({ id: 10, nome: 'Painel Dez', periodicidade: 'MENSAL' });

      const out = await service.toFileOutput(makeDto({ paineis: [10] }), ctxMock, user);

      // From the single painel, only the zero-valued series should be included (since null-only is skipped).
      // We can't inspect runPainelReport directly; assert CSV writer received one line.
      const { WriteCsvToFile } = jest.requireMock('src/common/helpers/CsvWriter') as {
        WriteCsvToFile: jest.Mock;
      };
      const call = (WriteCsvToFile as jest.Mock).mock.calls.find(Boolean);
      const linhas = call?.[0] as any[];
      expect(linhas.length).toBe(1);
      expect(linhas[0]).toEqual(
        expect.objectContaining({
          Previsto: 0,
          PrevistoAcumulado: 0,
          Realizado: 0,
          RealizadoAcumulado: 0,
        })
      );
    });
  });
});