import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

// Service under test
import { PSMonitoramentoMensal } from './ps-monitoramento-mensal.service';

// Dependencies to be mocked (paths may need adjustment if different in repo)
import { PrismaService } from '../../database/prisma.service';
import { UtilsService } from '../../utils/utils.service';
import { IndicadoresService } from '../indicadores/indicadores.service';

// CSV writer and helpers used by toFileOutput
import { WriteCsvToFile, DefaultCsvOptions, DefaultTransforms } from '../../utils/csv';

// Types (we avoid strict typing in tests to minimize coupling)
type PessoaFromJwt = any;
type CreatePsMonitoramentoMensalFilterDto = any;
type ReportContext = any;
type FileOutput = { name: string; localFile: string };

jest.mock('../../utils/csv', () => {
  return {
    __esModule: true,
    // Provide identity options and a mocked writer
    DefaultCsvOptions: { delimiter: ';', header: true },
    DefaultTransforms: [],
    WriteCsvToFile: jest.fn().mockResolvedValue(undefined),
  };
});

describe('PSMonitoramentoMensal Service', () => {
  let service: PSMonitoramentoMensal;
  let prisma: jest.Mocked<PrismaService>;
  let utils: jest.Mocked<UtilsService>;
  let indicadores: jest.Mocked<IndicadoresService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PSMonitoramentoMensal,
        {
          provide: UtilsService,
          useValue: {
            applyFilter: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $queryRawUnsafe: jest.fn(),
          },
        },
        {
          provide: IndicadoresService,
          useValue: {
            asJSON: jest.fn(),
            toFileOutput: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(PSMonitoramentoMensal);
    prisma = module.get(PrismaService) as any;
    utils = module.get(UtilsService) as any;
    indicadores = module.get(IndicadoresService) as any;
    jest.clearAllMocks();
  });

  describe('asJSON', () => {
    it('should aggregate monitoramento, ciclo_metas and indicadores with correct parameter mapping (pdm_id <- plano_setorial_id)', async () => {
      const params: CreatePsMonitoramentoMensalFilterDto = {
        plano_setorial_id: 123,
        pdm_id: 999, // should be overridden for indicadoresService call
        mes: '07',
        ano: '2025',
      };
      const user: PessoaFromJwt = { sub: 'user-1' };

      const monitoramentoRows = [{ id: 1 }];
      const cicloMetasRows = [{ meta_id: 10 }];
      const indicadoresPayload = { foo: 'bar', baz: 3 };

      // Spy private fetch method
      const fetchSpy = jest
        .spyOn<any, any>(service as any, 'fetchPsMonitoramentoMensalData')
        .mockResolvedValue(monitoramentoRows);

      // Spy private buscaMetasCiclo
      const cicloSpy = jest
        .spyOn<any, any>(service as any, 'buscaMetasCiclo')
        .mockResolvedValue(cicloMetasRows);

      indicadores.asJSON.mockResolvedValue(indicadoresPayload as any);

      const result = await service.asJSON(params, user);

      // Ensure internal calls occurred
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(expect.objectContaining(params), user);

      expect(indicadores.asJSON).toHaveBeenCalledTimes(1);
      // Validate that pdm_id passed to IndicadoresService is plano_setorial_id
      expect(indicadores.asJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          pdm_id: params.plano_setorial_id,
          periodo: 'Geral',
          tipo: 'Mensal',
        }),
        user
      );

      expect(cicloSpy).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        monitoramento: monitoramentoRows,
        ciclo_metas: cicloMetasRows,
        ...indicatorsPayloadShim(indicadoresPayload),
      });
    });
  });

  describe('fetchPsMonitoramentoMensalData (private)', () => {
    it('should throw BadRequest when pdm_id and plano_setorial_id are both missing', async () => {
      const params: any = { mes: '01', ano: '2024' };
      await expect((service as any).fetchPsMonitoramentoMensalData(params, null)).rejects.toThrow(
        new BadRequestException('Informe o parâmetro pdm_id')
      );
    });

    it('should call utils.applyFilter with pdm_id = params.pdm_id when provided', async () => {
      const params: any = { pdm_id: 777, mes: '02', ano: '2024' };
      utils.applyFilter.mockResolvedValue({ metas: [{ id: 5 }, { id: 6 }] });
      prisma.$queryRawUnsafe.mockResolvedValue([{ row: 1 }]);

      const rows = await (service as any).fetchPsMonitoramentoMensalData(params, null);

      expect(utils.applyFilter).toHaveBeenCalledWith(
        expect.objectContaining({ pdm_id: 777 }),
        { iniciativas: false, atividades: false },
        null
      );
      expect(prisma.$queryRawUnsafe).toHaveBeenCalledTimes(1);

      // Inspect generated SQL
      const sqlPassed = (prisma.$queryRawUnsafe as jest.Mock).mock.calls[0][0] as string;
      expect(sqlPassed).toContain("AND conferida = true::boolean");
      expect(sqlPassed).toContain("sv.variavel_id = v.id and sv.data_valor = '2024-02-01' ::date");
      expect(sqlPassed).toMatch(/IN \(\s*5,6\s*\)/);
      expect(rows).toEqual([{ row: 1 }]);
    });

    it('should default conferida to true when undefined, and use false when params.conferida = false', async () => {
      utils.applyFilter.mockResolvedValue({ metas: [{ id: 1 }] });
      prisma.$queryRawUnsafe.mockResolvedValue([{ ok: 1 }]);

      // conferida undefined -> true
      await (service as any).fetchPsMonitoramentoMensalData({ pdm_id: 1, mes: '03', ano: '2024' }, null);
      let sql = (prisma.$queryRawUnsafe as jest.Mock).mock.calls.pop()[0] as string;
      expect(sql).toContain('AND conferida = true::boolean');

      // conferida false
      await (service as any).fetchPsMonitoramentoMensalData({ pdm_id: 1, mes: '03', ano: '2024', conferida: false }, null);
      sql = (prisma.$queryRawUnsafe as jest.Mock).mock.calls.pop()[0] as string;
      expect(sql).toContain('AND conferida = false::boolean');
    });

    it('should include regionalization clause when listar_variaveis_regionalizadas = true', async () => {
      utils.applyFilter.mockResolvedValue({ metas: [{ id: 9 }] });
      prisma.$queryRawUnsafe.mockResolvedValue([{ ok: 1 }]);

      await (service as any).fetchPsMonitoramentoMensalData(
        { pdm_id: 10, mes: '04', ano: '2024', listar_variaveis_regionalizadas: true },
        null
      );
      const sql = (prisma.$queryRawUnsafe as jest.Mock).mock.calls.pop()[0] as string;
      expect(sql).toContain(' or v.variavel_mae_id = vvp.variavel_id ');
    });

    it('should push -1 when metas is empty to avoid SQL syntax error', async () => {
      utils.applyFilter.mockResolvedValue({ metas: [] });
      prisma.$queryRawUnsafe.mockResolvedValue([]);

      await (service as any).fetchPsMonitoramentoMensalData({ pdm_id: 2, mes: '05', ano: '2024' }, null);
      const sql = (prisma.$queryRawUnsafe as jest.Mock).mock.calls.pop()[0] as string;
      expect(sql).toMatch(/IN\s+\(\s*-1\s*\)/);
    });

    it('should throw when metas.length > 10000', async () => {
      utils.applyFilter.mockResolvedValue({ metas: new Array(10001).fill(0).map((_, i) => ({ id: i + 1 })) });
      await expect(
        (service as any).fetchPsMonitoramentoMensalData({ pdm_id: 3, mes: '06', ano: '2024' }, null)
      ).rejects.toThrow(
        new BadRequestException('Mais de 10000 indicadores encontrados, por favor refine a busca.')
      );
    });
  });

  describe('buscaMetasCiclo (private)', () => {
    it('should throw BadRequest when both pdm_id and plano_setorial_id are missing', async () => {
      await expect((service as any).buscaMetasCiclo({ mes: '01', ano: '2024' }, null)).rejects.toThrow(
        new BadRequestException('Informe o parâmetro pdm_id')
      );
    });

    it('should call utils.applyFilter with tipo_pdm = "PS" and replace placeholders correctly', async () => {
      utils.applyFilter.mockResolvedValue({ metas: [{ id: 100 }, { id: 200 }] });
      prisma.$queryRawUnsafe.mockResolvedValue([{ meta_id: 100 }]);

      await (service as any).buscaMetasCiclo({ pdm_id: 5, mes: '08', ano: '2024' }, null);
      expect(utils.applyFilter).toHaveBeenCalledWith(
        expect.objectContaining({ tipo_pdm: 'PS', pdm_id: 5 }),
        { iniciativas: true, atividades: true },
        null
      );
      const sql = (prisma.$queryRawUnsafe as jest.Mock).mock.calls.pop()[0] as string;
      expect(sql).toContain("'2024-08-01' ::date");
      expect(sql).toContain("m.id in (100,200)");
      expect(sql).toContain("cf.pdm_id = 5");
    });

    it('should use metas = 0 in SQL when metas are empty', async () => {
      utils.applyFilter.mockResolvedValue({ metas: [] });
      prisma.$queryRawUnsafe.mockResolvedValue([]);

      await (service as any).buscaMetasCiclo({ pdm_id: 7, mes: '09', ano: '2024' }, null);
      const sql = (prisma.$queryRawUnsafe as jest.Mock).mock.calls.pop()[0] as string;
      expect(sql).toContain("m.id in (0)");
    });

    it('should throw when metas.length > 10000', async () => {
      utils.applyFilter.mockResolvedValue({ metas: new Array(10001).fill(0).map((_, i) => ({ id: i })) });
      await expect(
        (service as any).buscaMetasCiclo({ pdm_id: 7, mes: '09', ano: '2024' }, null)
      ).rejects.toThrow(
        new BadRequestException('Mais de 10000 indicadores encontrados, por favor refine a busca.')
      );
    });
  });

  describe('toFileOutput', () => {
    const makeCtx = (): ReportContext => {
      const tmp = { stream: {}, path: '/tmp/file.csv' };
      return {
        resumoSaida: jest.fn(),
        progress: jest.fn().mockResolvedValue(undefined),
        getTmpFile: jest.fn().mockReturnValue(tmp),
      };
    };

    it('should produce no CSVs when there are no rows but append indicadores outputs', async () => {
      const ctx = makeCtx();
      const params: any = { tipo_pdm: 'PS', pdm_id: 1, mes: '10', ano: '2024' };
      jest.spyOn<any, any>(service as any, 'fetchPsMonitoramentoMensalData').mockResolvedValue([]);
      jest.spyOn<any, any>(service as any, 'buscaMetasCiclo').mockResolvedValue([]);
      indicadores.toFileOutput.mockResolvedValue([
        { name: 'ind1.csv', localFile: '/tmp/ind1.csv' },
        { name: 'ind2.csv', localFile: '/tmp/ind2.csv' },
      ] as any);

      const out = await service.toFileOutput(params, ctx, null);

      expect(ctx.resumoSaida).toHaveBeenCalledWith('Monitoramento Mensal Variáveis PS', 0);
      expect(ctx.progress).toHaveBeenCalledWith(40);
      expect(ctx.resumoSaida).toHaveBeenCalledWith('Monitoramento Mensal Metas Ciclo PS', 0);
      expect(WriteCsvToFile).not.toHaveBeenCalled();

      // Indicators appended
      expect(indicadores.toFileOutput).toHaveBeenCalledWith(
        expect.objectContaining({ pdm_id: 1, periodo: 'Geral', tipo: 'Mensal' }),
        ctx,
        null
      );
      expect(out).toEqual([
        { name: 'ind1.csv', localFile: '/tmp/ind1.csv' },
        { name: 'ind2.csv', localFile: '/tmp/ind2.csv' },
      ]);
    });

    it('should write both CSV files when rows exist with correct field definitions', async () => {
      const ctx = makeCtx();
      const params: any = { tipo_pdm: 'PS', pdm_id: 1, mes: '11', ano: '2024' };

      const variaveisRows = [
        {
          indicador_id: 1,
          codigo_indicador: 'I-1',
          titulo_indicador: 'Ind 1',
          variavel_id: 10,
          codigo_variavel: 'V-10',
          titulo_variavel: 'Var 10',
          municipio: 'Some',
          municipio_id: 999,
          regiao: 'Reg',
          regiao_id: 111,
          subprefeitura: null,
          subprefeitura_id: null,
          distrito: null,
          distrito_id: null,
          serie: 'S',
          data_referencia: '2024-11-01',
          valor_nominal: 12.34,
          valor_categorica: null,
          data_preenchimento: '2024-11-02',
          analise_qualitativa_coleta: '',
          analise_qualitativa_aprovador: '',
          analise_qualitativa_liberador: '',
        },
      ];
      const metasRows = [
        {
          meta_id: 7,
          meta_codigo: 'M-7',
          analise_qualitativa: 'ok',
          analise_qualitativa_data: '2024-11-01',
          risco_detalhamento: '',
          risco_ponto_atencao: '',
          fechamento_comentario: '',
        },
      ];

      jest.spyOn<any, any>(service as any, 'fetchPsMonitoramentoMensalData').mockResolvedValue(variaveisRows);
      jest.spyOn<any, any>(service as any, 'buscaMetasCiclo').mockResolvedValue(metasRows);
      indicadores.toFileOutput.mockResolvedValue([]);

      const out = await service.toFileOutput(params, ctx, null);

      // Two CSV outputs should be produced
      expect(WriteCsvToFile).toHaveBeenCalledTimes(2);

      // First CSV fields headers
      const firstCall = (WriteCsvToFile as jest.Mock).mock.calls[0];
      const firstRows = firstCall[0];
      const firstStream = firstCall[1];
      const firstOptions = firstCall[2];

      expect(firstRows).toEqual(variaveisRows);
      expect(firstStream).toBeDefined();
      expect(firstOptions.csvOptions).toEqual(DefaultCsvOptions);
      expect(firstOptions.transforms).toEqual(DefaultTransforms);
      expect(firstOptions.fields.map((f: any) => f.value)).toEqual([
        'codigo_indicador',
        'titulo_indicador',
        'indicador_id',
        'codigo_variavel',
        'titulo_variavel',
        'variavel_id',
        'municipio',
        'municipio_id',
        'regiao',
        'regiao_id',
        'subprefeitura',
        'subprefeitura_id',
        'distrito',
        'distrito_id',
        'serie',
        'data_referencia',
        'valor_nominal',
        'valor_categorica',
        'data_preenchimento',
        'analise_qualitativa_coleta',
        'analise_qualitativa_aprovador',
        'analise_qualitativa_liberador',
      ]);

      // Second CSV fields headers
      const secondCall = (WriteCsvToFile as jest.Mock).mock.calls[1];
      const secondRows = secondCall[0];
      const secondStream = secondCall[1];
      const secondOptions = secondCall[2];

      expect(secondRows).toEqual(metasRows);
      expect(secondStream).toBeDefined();
      expect(secondOptions.csvOptions).toEqual(DefaultCsvOptions);
      expect(secondOptions.transforms).toEqual(DefaultTransforms);
      expect(secondOptions.fields.map((f: any) => f.value)).toEqual([
        'meta_id',
        'meta_codigo',
        'analise_qualitativa',
        'analise_qualitativa_data',
        'risco_detalhamento',
        'risco_ponto_atencao',
        'fechamento_comentario',
      ]);

      // Output names contain expected file names
      expect(out.find((f: FileOutput) => f.name === 'monitoramento-mensal-variaveis-ps.csv')).toBeTruthy();
      expect(out.find((f: FileOutput) => f.name === 'monitoramento-mensal-metas-ciclo-ps.csv')).toBeTruthy();
    });

    it('should still append indicadores outputs after generating CSVs', async () => {
      const ctx = makeCtx();
      const params: any = { tipo_pdm: 'PS', pdm_id: 1, mes: '11', ano: '2024' };

      jest.spyOn<any, any>(service as any, 'fetchPsMonitoramentoMensalData').mockResolvedValue([{}]);
      jest.spyOn<any, any>(service as any, 'buscaMetasCiclo').mockResolvedValue([{}]);
      indicadores.toFileOutput.mockResolvedValue([{ name: 'ind.csv', localFile: '/tmp/ind.csv' }] as any);

      const out = await service.toFileOutput(params, ctx, null);
      expect(out.some((f: FileOutput) => f.name === 'ind.csv')).toBe(true);
    });
  });
});

// Helper to preserve spread semantics
function indicatorsPayloadShim(obj: any) {
  return obj ?? {};
}