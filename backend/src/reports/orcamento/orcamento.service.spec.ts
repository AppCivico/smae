/**
 * Testing framework: Jest with @nestjs/testing
 * These tests focus on OrcamentoService's public interfaces and core pure conversion helpers.
 * We mock external dependencies (PrismaService, DotacaoService, UtilsService, WriteCsvToFile, ReportContext).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { OrcamentoService } from './orcamento.service';
import { PrismaService } from '../../../database/prisma.service';
import { DotacaoService } from '../../dotacao/dotacao.service';
import { UtilsService } from '../../utils/utils.service';

// Utilities and types used by toFileOutput
jest.mock('../../utils/csv', () => ({
  WriteCsvToFile: jest.fn().mockResolvedValue(void 0),
  DefaultCsvOptions: {},
  DefaultTransforms: [],
}));
import { WriteCsvToFile } from '../../utils/csv';

type PessoaFromJwt = any;
type FileOutput = { name: string; localFile?: string; buffer?: Buffer };

const makeCtx = () => {
  const tmpFiles: Record<string, { path: string; stream: any }> = {};
  return {
    progress: jest.fn().mockResolvedValue(void 0),
    resumoSaida: jest.fn().mockResolvedValue(void 0),
    getTmpFile: jest.fn().mockImplementation((name: string) => {
      // Simulate a tmp file handle with a path and a writable-like stream stub
      const handle = {
        path: `/tmp/${name}`,
        stream: { write: jest.fn(), end: jest.fn() },
      };
      tmpFiles[name] = handle;
      return handle;
    }),
    __tmpFiles: tmpFiles,
  };
};

describe('OrcamentoService', () => {
  let service: OrcamentoService;
  let prisma: jest.Mocked<PrismaService>;
  let dotacao: jest.Mocked<DotacaoService>;
  let utils: jest.Mocked<UtilsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrcamentoService,
        { provide: PrismaService, useValue: {
          $queryRaw: jest.fn(),
          orcamentoRealizadoItem: { findMany: jest.fn() },
          orcamentoPlanejado: { findMany: jest.fn() },
          pdm: { findUnique: jest.fn() },
        }},
        { provide: DotacaoService, useValue: {
          getAcaoOrcamentaria: jest.fn().mockImplementation((d: string) => d?.split('.')?.slice(0,4)?.join('.') ?? ''),
          setManyOrgaoUnidadeFonte: jest.fn().mockResolvedValue(void 0),
        }},
        { provide: UtilsService, useValue: {
          applyFilter: jest.fn().mockResolvedValue({ metas: [] }),
        }},
      ],
    }).compile();

    service = module.get(OrcamentoService);
    prisma = module.get(PrismaService) as any;
    dotacao = module.get(DotacaoService) as any;
    utils = module.get(UtilsService) as any;
  });

  describe('convertRealizadoRow', () => {
    it('maps fields, formats dotacao with complement, computes logs and preserves nullables', () => {
      const now = new Date('2025-01-02T03:04:05.000Z');
      const db: any = {
        dotacao: '123.456.789.000.111',
        dotacao_complemento: '77',
        processo: 'PROC-42',
        nota_empenho: 'NE/2025',
        meta_id: '10',
        meta_codigo: 'M-10',
        meta_titulo: 'Meta Dez',
        iniciativa_id: '20',
        iniciativa_codigo: 'I-20',
        iniciativa_titulo: 'Inic Vinte',
        atividade_id: '30',
        atividade_codigo: 'A-30',
        atividade_titulo: 'Ativ Trinta',
        projeto_id: '40',
        projeto_codigo: 'P-40',
        projeto_nome: 'Projeto Quarenta',
        plan_dotacao_sincronizado_em: now,
        plan_sof_val_orcado_atualizado: '1000.00',
        plan_valor_planejado: '900.00',
        plan_dotacao_ano_utilizado: '2025',
        plan_dotacao_mes_utilizado: '1',
        dotacao_sincronizado_em: '2025-01-02',
        dotacao_valor_empenhado: '500.00',
        dotacao_valor_liquidado: '300.00',
        dotacao_ano_utilizado: '2025',
        dotacao_mes_utilizado: '1',
        smae_valor_empenhado: '400.00',
        smae_valor_liquidado: '200.00',
        smae_percentual_empenho: '0.4',
        smae_percentual_liquidado: '0.2',
        mes: '01',
        ano: '2025',
        mes_corrente: true,
        total_registros: 3,
        orcamento_realizado_item_id: 99,
      };

      // @ts-expect-error access private for unit testing
      const out = (service as any).convertRealizadoRow(db);

      expect(dotacao.getAcaoOrcamentaria).toHaveBeenCalledWith('123.456.789.000.111');
      expect(out.dotacao).toBe('123.456.789.000.111.77');
      expect(out.processo).toBe('PROC-42');
      expect(out.nota_empenho).toBe('NE/2025');
      expect(out.meta).toEqual({ codigo: 'M-10', titulo: 'Meta Dez', id: 10 });
      expect(out.iniciativa).toEqual({ codigo: 'I-20', titulo: 'Inic Vinte', id: 20 });
      expect(out.atividade).toEqual({ codigo: 'A-30', titulo: 'Ativ Trinta', id: 30 });
      expect(out.projeto).toEqual({ codigo: 'P-40', nome: 'Projeto Quarenta', id: 40 });
      expect(out.plan_dotacao_sincronizado_em).toBe(now.toISOString());
      expect(out.plan_dotacao_ano_utilizado).toBe('2025');
      expect(out.plan_dotacao_mes_utilizado).toBe('1');
      expect(out.dotacao_valor_empenhado).toBe('500.00');
      expect(out.dotacao_valor_liquidado).toBe('300.00');
      expect(out.smae_valor_empenhado).toBe('400.00');
      expect(out.smae_valor_liquidado).toBe('200.00');
      expect(out.smae_percentual_empenho).toBe('0.4');
      expect(out.smae_percentual_liquidado).toBe('0.2');
      expect(out.mes_corrente).toBe(true);
      // logs should include both messages
      expect(out.logs).toEqual(
        expect.arrayContaining([
          'Total de Itens Consolidados 3',
          'orcamento_realizado_item_id = 99',
        ])
      );
    });

    it('handles missing optional fields and nulls gracefully', () => {
      const db: any = {
        dotacao: '123.456',
        dotacao_complemento: null,
        processo: null,
        nota_empenho: null,
        meta_id: '1',
        meta_codigo: 'M',
        meta_titulo: 'Meta',
        iniciativa_id: null,
        atividade_id: null,
        projeto_id: null,
        plan_dotacao_sincronizado_em: null,
        plan_sof_val_orcado_atualizado: null,
        plan_valor_planejado: null,
        plan_dotacao_ano_utilizado: null,
        plan_dotacao_mes_utilizado: null,
        dotacao_sincronizado_em: '',
        dotacao_valor_empenhado: '',
        dotacao_valor_liquidado: '',
        dotacao_ano_utilizado: null,
        dotacao_mes_utilizado: null,
        smae_valor_empenhado: '',
        smae_valor_liquidado: '',
        smae_percentual_empenho: null,
        smae_percentual_liquidado: null,
        mes: '',
        ano: '',
        mes_corrente: false,
      };

      // @ts-expect-error private
      const out = (service as any).convertRealizadoRow(db);

      expect(out.dotacao).toBe('123.456');
      expect(out.iniciativa).toBeNull();
      expect(out.atividade).toBeNull();
      expect(out.projeto).toBeNull();
      expect(out.plan_dotacao_sincronizado_em).toBeNull();
      expect(out.plan_dotacao_ano_utilizado).toBeNull();
      expect(out.plan_dotacao_mes_utilizado).toBeNull();
      // empty string fallbacks for dotacao_ano/mes_utilizado
      expect(out.dotacao_ano_utilizado).toBe('');
      expect(out.dotacao_mes_utilizado).toBe('');
      expect(out.logs).toEqual([]); // since no total_registros / id
    });
  });

  describe('convertPlanejadoRow', () => {
    it('maps fields and builds logs for total_registros and orcamento_planejado_id', () => {
      const now = new Date('2025-03-04T05:06:07.000Z');
      const db: any = {
        dotacao: '111.222.333.444',
        meta_id: '10',
        meta_codigo: 'MX',
        meta_titulo: 'Meta X',
        iniciativa_id: '0', // unlikely but stringy zero should still map
        iniciativa_codigo: 'IX',
        iniciativa_titulo: 'Inic X',
        atividade_id: '12',
        atividade_codigo: 'AX',
        atividade_titulo: 'Ativ X',
        projeto_id: '55',
        projeto_codigo: 'PR-55',
        projeto_nome: 'Projeto 55',
        plan_dotacao_sincronizado_em: now,
        plan_sof_val_orcado_atualizado: '777.00',
        plan_valor_planejado: '888.00',
        plan_dotacao_ano_utilizado: '2024',
        plan_dotacao_mes_utilizado: '12',
        ano: '2024',
        total_registros: 5,
        orcamento_planejado_id: 1234,
      };

      // @ts-expect-error private
      const out = (service as any).convertPlanejadoRow(db);

      expect(dotacao.getAcaoOrcamentaria).toHaveBeenCalledWith('111.222.333.444');
      expect(out.meta).toEqual({ codigo: 'MX', titulo: 'Meta X', id: 10 });
      expect(out.iniciativa).toEqual({ codigo: 'IX', titulo: 'Inic X', id: 0 });
      expect(out.atividade).toEqual({ codigo: 'AX', titulo: 'Ativ X', id: 12 });
      expect(out.projeto).toEqual({ codigo: 'PR-55', nome: 'Projeto 55', id: 55 });
      expect(out.plan_dotacao_sincronizado_em).toBe(now.toISOString());
      expect(out.plan_dotacao_ano_utilizado).toBe('2024');
      expect(out.plan_dotacao_mes_utilizado).toBe('12');
      expect(out.acao_orcamentaria).toBe('111.222.333.444'.split('.').slice(0,4).join('.'));
      expect(out.logs).toEqual(
        expect.arrayContaining([
          'Total de Itens Consolidados 5',
          'orcamento_planejado_id = 1234',
        ])
      );
    });

    it('handles null initiative/atividade/projeto and blank sync fields', () => {
      const db: any = {
        dotacao: '1.2.3.4',
        meta_id: '1',
        meta_codigo: 'M',
        meta_titulo: 'Meta',
        iniciativa_id: null,
        atividade_id: null,
        projeto_id: null,
        plan_dotacao_sincronizado_em: null,
        plan_sof_val_orcado_atualizado: null,
        plan_valor_planejado: null,
        plan_dotacao_ano_utilizado: null,
        plan_dotacao_mes_utilizado: null,
        ano: '2023',
      };

      // @ts-expect-error private
      const out = (service as any).convertPlanejadoRow(db);

      expect(out.iniciativa).toBeNull();
      expect(out.atividade).toBeNull();
      expect(out.projeto).toBeNull();
      expect(out.plan_dotacao_sincronizado_em).toBe('');
      expect(out.plan_dotacao_ano_utilizado).toBe('');
      expect(out.plan_dotacao_mes_utilizado).toBe('');
      expect(out.logs).toEqual([]);
    });
  });

  describe('asJSON', () => {
    it('returns executed and planned lines for tipo Analitico and calls setManyOrgaoUnidadeFonte twice', async () => {
      // Stub private buscaIds to control ids and years
      const buscaIdsSpy = jest
        // @ts-expect-error private method
        .spyOn(service as any, 'buscaIds')
        .mockResolvedValue({
          orcExec: [{ id: 1 }],
          anoIni: '2024',
          anoFim: '2025',
          orcPlan: [{ id: 2 }],
        });

      // Mock queries
      // @ts-expect-error private
      jest.spyOn(service as any, 'queryAnaliticoExecutado').mockResolvedValue([
        {
          dotacao: '1.2.3.4',
          dotacao_complemento: null,
          processo: null,
          nota_empenho: null,
          meta_id: '1',
          meta_codigo: 'M',
          meta_titulo: 'Meta',
          iniciativa_id: null,
          atividade_id: null,
          projeto_id: null,
          plan_dotacao_sincronizado_em: null,
          plan_sof_val_orcado_atualizado: null,
          plan_valor_planejado: null,
          plan_dotacao_ano_utilizado: null,
          plan_dotacao_mes_utilizado: null,
          dotacao_sincronizado_em: '',
          dotacao_valor_empenhado: '',
          dotacao_valor_liquidado: '',
          dotacao_ano_utilizado: '',
          dotacao_mes_utilizado: '',
          smae_valor_empenhado: '',
          smae_valor_liquidado: '',
          smae_percentual_empenho: null,
          smae_percentual_liquidado: null,
          mes: '01',
          ano: '2024',
          mes_corrente: true,
          total_registros: 1,
          orcamento_realizado_item_id: 10,
        },
      ]);

      // @ts-expect-error private
      jest.spyOn(service as any, 'queryAnaliticoPlanejado').mockResolvedValue([
        {
          dotacao: '1.2.3.4',
          meta_id: '1',
          meta_codigo: 'M',
          meta_titulo: 'Meta',
          iniciativa_id: null,
          atividade_id: null,
          projeto_id: null,
          plan_dotacao_sincronizado_em: null,
          plan_sof_val_orcado_atualizado: '0',
          plan_valor_planejado: '0',
          plan_dotacao_ano_utilizado: '2024',
          plan_dotacao_mes_utilizado: '1',
          ano: '2024',
          total_registros: 1,
          orcamento_planejado_id: 22,
        },
      ]);

      const dto: any = { tipo: 'Analitico' };
      const result = await service.asJSON(dto, null);

      expect(buscaIdsSpy).toHaveBeenCalled();
      expect(dotacao.setManyOrgaoUnidadeFonte).toHaveBeenCalledTimes(2);
      expect(result.linhas).toHaveLength(1);
      expect(result.linhas_planejado).toHaveLength(1);
      expect(result.linhas[0].logs).toEqual(
        expect.arrayContaining([
          'Total de Itens Consolidados 1',
          'orcamento_realizado_item_id = 10',
        ])
      );
      expect(result.linhas_planejado[0].logs).toEqual(
        expect.arrayContaining([
          'Total de Itens Consolidados 1',
          'orcamento_planejado_id = 22',
        ])
      );
    });

    it('returns executed and planned lines for tipo Consolidado using consolidated queries', async () => {
      // @ts-expect-error
      jest.spyOn(service as any, 'buscaIds').mockResolvedValue({
        orcExec: [{ id: 3 }],
        anoIni: '2022',
        anoFim: '2023',
        orcPlan: [{ id: 4 }],
      });

      // @ts-expect-error
      const qExec = jest.spyOn(service as any, 'queryConsolidadoExecutado').mockResolvedValue([
        {
          dotacao: '9.9.9.9',
          dotacao_complemento: null,
          processo: null,
          nota_empenho: null,
          meta_id: '7',
          meta_codigo: 'MX',
          meta_titulo: 'Meta X',
          iniciativa_id: null,
          atividade_id: null,
          projeto_id: null,
          plan_dotacao_sincronizado_em: null,
          plan_sof_val_orcado_atualizado: null,
          plan_valor_planejado: null,
          plan_dotacao_ano_utilizado: null,
          plan_dotacao_mes_utilizado: null,
          dotacao_sincronizado_em: '',
          dotacao_valor_empenhado: '',
          dotacao_valor_liquidado: '',
          dotacao_ano_utilizado: '',
          dotacao_mes_utilizado: '',
          smae_valor_empenhado: '10',
          smae_valor_liquidado: '5',
          smae_percentual_empenho: null,
          smae_percentual_liquidado: null,
          mes: '',
          ano: '',
          mes_corrente: false,
          total_registros: 2,
          orcamento_realizado_item_id: 77,
        },
      ]);

      // @ts-expect-error
      const qPlan = jest.spyOn(service as any, 'queryConsolidadoPlanejado').mockResolvedValue([
        {
          dotacao: '9.9.9.9',
          meta_id: '7',
          meta_codigo: 'MX',
          meta_titulo: 'Meta X',
          iniciativa_id: null,
          atividade_id: null,
          projeto_id: null,
          plan_dotacao_sincronizado_em: null,
          plan_sof_val_orcado_atualizado: '100',
          plan_valor_planejado: '90',
          plan_dotacao_ano_utilizado: '2023',
          plan_dotacao_mes_utilizado: '12',
          ano: '2023',
          total_registros: 2,
          orcamento_planejado_id: 88,
        },
      ]);

      const dto: any = { tipo: 'Consolidado' };
      const result = await service.asJSON(dto, null);

      expect(qExec).toHaveBeenCalled();
      expect(qPlan).toHaveBeenCalled();
      expect(result.linhas).toHaveLength(1);
      expect(result.linhas_planejado).toHaveLength(1);
    });

    it('handles empty orcExec gracefully and still returns empty arrays', async () => {
      // @ts-expect-error
      jest.spyOn(service as any, 'buscaIds').mockResolvedValue({
        orcExec: [],
        anoIni: '2024',
        anoFim: '2024',
        orcPlan: [],
      });

      const dto: any = { tipo: 'Analitico' };
      const result = await service.asJSON(dto, null);

      // setMany called with empty arrays twice
      expect(dotacao.setManyOrgaoUnidadeFonte).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ linhas: [], linhas_planejado: [] });
    });
  });

  describe('toFileOutput', () => {
    it('emits executado.csv and planejado.csv for Analitico, writes via WriteCsvToFile, and includes info.json', async () => {
      // Mock buscaIds and queries similar to asJSON test
      // @ts-expect-error
      jest.spyOn(service as any, 'buscaIds').mockResolvedValue({
        orcExec: [{ id: 1 }],
        anoIni: '2024',
        anoFim: '2025',
        orcPlan: [{ id: 2 }],
      });
      // @ts-expect-error
      jest.spyOn(service as any, 'queryAnaliticoExecutado').mockResolvedValue([
        {
          dotacao: '1.2.3.4',
          dotacao_complemento: null,
          processo: null,
          nota_empenho: null,
          meta_id: '1',
          meta_codigo: 'M',
          meta_titulo: 'Meta',
          iniciativa_id: null,
          atividade_id: null,
          projeto_id: null,
          plan_dotacao_sincronizado_em: null,
          plan_sof_val_orcado_atualizado: null,
          plan_valor_planejado: null,
          plan_dotacao_ano_utilizado: null,
          plan_dotacao_mes_utilizado: null,
          dotacao_sincronizado_em: '',
          dotacao_valor_empenhado: '',
          dotacao_valor_liquidado: '',
          dotacao_ano_utilizado: '',
          dotacao_mes_utilizado: '',
          smae_valor_empenhado: '',
          smae_valor_liquidado: '',
          smae_percentual_empenho: null,
          smae_percentual_liquidado: null,
          mes: '01',
          ano: '2024',
          mes_corrente: true,
          total_registros: 1,
          orcamento_realizado_item_id: 10,
        },
      ]);
      // @ts-expect-error
      jest.spyOn(service as any, 'queryAnaliticoPlanejado').mockResolvedValue([
        {
          dotacao: '1.2.3.4',
          meta_id: '1',
          meta_codigo: 'M',
          meta_titulo: 'Meta',
          iniciativa_id: null,
          atividade_id: null,
          projeto_id: null,
          plan_dotacao_sincronizado_em: null,
          plan_sof_val_orcado_atualizado: '0',
          plan_valor_planejado: '0',
          plan_dotacao_ano_utilizado: '2024',
          plan_dotacao_mes_utilizado: '1',
          ano: '2024',
          total_registros: 1,
          orcamento_planejado_id: 22,
        },
      ]);

      const ctx = makeCtx();
      const params: any = { tipo: 'Analitico', inicio: new Date('2024-01-01'), fim: new Date('2024-12-31') };
      const out = await service.toFileOutput(params, ctx as any, null);

      // Verify progress milestones were called
      expect(ctx.progress).toHaveBeenCalledWith(1);
      expect(ctx.progress).toHaveBeenCalledWith(30);
      expect(ctx.progress).toHaveBeenCalledWith(50);
      expect(ctx.progress).toHaveBeenCalledWith(70);
      expect(ctx.progress).toHaveBeenCalledWith(99);

      // Ensure CSV writer was invoked twice with stream handles
      expect(WriteCsvToFile).toHaveBeenCalledTimes(2);

      // Output should include info.json + both CSV entries
      const names = out.map(o => o.name).sort();
      expect(names).toEqual(['executado.csv', 'info.json', 'planejado.csv'].sort());

      const info = out.find(o => o.name === 'info.json');
      expect(info?.buffer).toBeInstanceOf(Buffer);
      const parsed = JSON.parse((info!.buffer as Buffer).toString('utf8'));
      expect(parsed.params).toBeDefined();
      expect(parsed.horario).toBeDefined();

      const exec = out.find(o => o.name === 'executado.csv');
      const plan = out.find(o => o.name === 'planejado.csv');
      expect(exec?.localFile).toBe('/tmp/executado.csv');
      expect(plan?.localFile).toBe('/tmp/planejado.csv');
    });

    it('for Consolidado without PDM defaults to project columns and still writes outputs when results exist', async () => {
      // @ts-expect-error
      jest.spyOn(service as any, 'buscaIds').mockResolvedValue({
        orcExec: [{ id: 1 }],
        anoIni: '2023',
        anoFim: '2023',
        orcPlan: [{ id: 2 }],
      });
      prisma.pdm.findUnique.mockResolvedValue(null);
      // @ts-expect-error
      jest.spyOn(service as any, 'queryConsolidadoExecutado').mockResolvedValue([
        {
          dotacao: '5.5.5.5',
          dotacao_complemento: null,
          processo: null,
          nota_empenho: null,
          meta_id: '1',
          meta_codigo: 'M',
          meta_titulo: 'Meta',
          iniciativa_id: null,
          atividade_id: null,
          projeto_id: '10',
          projeto_codigo: 'P10',
          projeto_nome: 'Projeto Dez',
          plan_dotacao_sincronizado_em: null,
          plan_sof_val_orcado_atualizado: null,
          plan_valor_planejado: null,
          plan_dotacao_ano_utilizado: null,
          plan_dotacao_mes_utilizado: null,
          dotacao_sincronizado_em: '',
          dotacao_valor_empenhado: '1',
          dotacao_valor_liquidado: '1',
          dotacao_ano_utilizado: '',
          dotacao_mes_utilizado: '',
          smae_valor_empenhado: '1',
          smae_valor_liquidado: '1',
          smae_percentual_empenho: null,
          smae_percentual_liquidado: null,
          mes: '',
          ano: '',
          mes_corrente: false,
          total_registros: 1,
          orcamento_realizado_item_id: 1,
        },
      ]);
      // @ts-expect-error
      jest.spyOn(service as any, 'queryConsolidadoPlanejado').mockResolvedValue([
        {
          dotacao: '5.5.5.5',
          meta_id: '1',
          meta_codigo: 'M',
          meta_titulo: 'Meta',
          iniciativa_id: null,
          atividade_id: null,
          projeto_id: '10',
          projeto_codigo: 'P10',
          projeto_nome: 'Projeto Dez',
          plan_dotacao_sincronizado_em: null,
          plan_sof_val_orcado_atualizado: '0',
          plan_valor_planejado: '0',
          plan_dotacao_ano_utilizado: '2023',
          plan_dotacao_mes_utilizado: '1',
          ano: '2023',
          total_registros: 1,
          orcamento_planejado_id: 2,
        },
      ]);

      const ctx = makeCtx();
      const params: any = { tipo: 'Consolidado', inicio: new Date('2023-01-01'), fim: new Date('2023-12-31') };
      const out = await service.toFileOutput(params, ctx as any, null);

      expect(WriteCsvToFile).toHaveBeenCalledTimes(2);
      expect(out.some(o => o.name === 'executado.csv')).toBe(true);
      expect(out.some(o => o.name === 'planejado.csv')).toBe(true);
    });
  });
});