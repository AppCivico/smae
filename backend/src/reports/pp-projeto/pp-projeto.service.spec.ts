/* Testing framework: Jest with @nestjs/testing (NestJS) */

import { Test, TestingModule } from '@nestjs/testing';


// The service under test and the types are located within the same feature folder in this project.
// We keep imports relative to the service file location used in the app. If paths differ in your repo,
// adjust these imports accordingly.
import { PPProjetoService } from './pp-projeto.service';

// External dependencies to be mocked
import { PrismaService } from '../../prisma/prisma.service';
import { ProjetoService } from '../../projeto/projeto.service';
import { RiscoService } from '../../risco/risco.service';
import { PlanoAcaoService } from '../../plano-acao/plano-acao.service';
import { TarefaService } from '../../tarefa/tarefa.service';
import { AcompanhamentoService } from '../../acompanhamento/acompanhamento.service';

// Types used in method signatures; import paths may vary across the repo.
// If your repo places them elsewhere, adjust these imports accordingly.
import { CreateRelProjetoDto } from '../dto/create-rel.dto';
import { PessoaFromJwt } from '../../auth/auth.types';
import { ReportContext, FileOutput } from '../report.types';

// Utilities that are referenced by toFileOutput/asJSON code
import { WriteCsvToBuffer, DefaultCsvOptions, DefaultTransforms } from '../csv/csv-writer';
import { Stream2Buffer } from '../../common/stream2buffer';
import { Date2YMD } from '../../common/date2ymd';
import { DateTime } from 'luxon';
import { SYSTEM_TIMEZONE } from '../../common/timezone';
import { ProjetoStatusParaExibicao } from '../../projeto/projeto-status';

jest.mock('../csv/csv-writer', () => ({
  WriteCsvToBuffer: jest.fn(() => Buffer.from('csv')),
  DefaultCsvOptions: {},
  DefaultTransforms: [],
}));
jest.mock('../../common/stream2buffer', () => ({
  Stream2Buffer: jest.fn(async (s: any) => Buffer.from('svg-bytes')),
}));
jest.mock('../../common/date2ymd', () => ({
  Date2YMD: {
    tzSp2UTC: jest.fn((d: Date) => d.toISOString()),
  },
}));

// Provide deterministic DateTime and timezone behavior
jest.mock('luxon', () => {
  const actual = jest.requireActual('luxon');
  return {
    ...actual,
    DateTime: {
      local: jest.fn(() => ({ year: 2025 })), // stable current year
    },
  };
});
// Provide a constant timezone for determinism
jest.mock('../../common/timezone', () => ({
  SYSTEM_TIMEZONE: 'America/Sao_Paulo',
}));

describe('PPProjetoService (unit)', () => {
  let service: PPProjetoService;

  // Mocks
  let prisma: jest.Mocked<PrismaService>;
  let projetoService: jest.Mocked<ProjetoService>;
  let riscoService: jest.Mocked<RiscoService>;
  let planoAcaoService: jest.Mocked<PlanoAcaoService>;
  let tarefaService: jest.Mocked<TarefaService>;
  let acompanhamentoService: jest.Mocked<AcompanhamentoService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PPProjetoService,
        { provide: PrismaService, useValue: createPrismaMock() },
        { provide: ProjetoService, useValue: createProjetoServiceMock() },
        { provide: RiscoService, useValue: createRiscoServiceMock() },
        { provide: PlanoAcaoService, useValue: createPlanoAcaoServiceMock() },
        { provide: TarefaService, useValue: createTarefaServiceMock() },
        { provide: AcompanhamentoService, useValue: createAcompanhamentoServiceMock() },
      ],
    }).compile();

    service = module.get(PPProjetoService);
    prisma = module.get(PrismaService) as any;
    projetoService = module.get(ProjetoService) as any;
    riscoService = module.get(RiscoService) as any;
    planoAcaoService = module.get(PlanoAcaoService) as any;
    tarefaService = module.get(TarefaService) as any;
    acompanhamentoService = module.get(AcompanhamentoService) as any;
  });

  describe('convertRowsContratos', () => {
    it('maps DB rows to DTOs including nested objects and null handling', () => {
      const input = [
        {
          id: 1,
          projeto_id: 10,
          numero: 'C-001',
          exclusivo: true,
          processos_sei: '123|456',
          status: 'ATIVO',
          modalidade_contratacao_id: 9,
          modalidade_contratacao_nome: 'Tomada de Preços',
          fontes_recurso: '100|200',
          orgao_id: 7,
          orgao_sigla: 'SG',
          orgao_descricao: 'Secretaria Geral',
          objeto: 'Obra X',
          descricao_detalhada: 'Detalhe',
          contratante: 'Governo',
          empresa_contratada: 'Construtora',
          prazo: 12,
          unidade_prazo: 'MESES',
          data_base: '01/2025',
          data_inicio: new Date('2025-01-01T00:00:00Z'),
          data_termino: new Date('2025-12-31T00:00:00Z'),
          data_termino_atualizada: new Date('2026-06-30T00:00:00Z'),
          valor: 1000,
          valor_reajustado: 1200,
          percentual_medido: 50,
          observacoes: 'Obs',
        },
        {
          // Case with nullables -> should produce null nested objects
          id: 2,
          projeto_id: 10,
          numero: 'C-002',
          exclusivo: false,
          processos_sei: null,
          status: 'SUSPENSO',
          modalidade_contratacao_id: null,
          modalidade_contratacao_nome: null,
          fontes_recurso: null,
          orgao_id: null,
          orgao_sigla: null,
          orgao_descricao: null,
          objeto: null,
          descricao_detalhada: null,
          contratante: null,
          empresa_contratada: null,
          prazo: null,
          unidade_prazo: null,
          data_base: null,
          data_inicio: null,
          data_termino: null,
          data_termino_atualizada: null,
          valor: null,
          valor_reajustado: null,
          percentual_medido: null,
          observacoes: null,
        },
      ] as any;

      // @ts-expect-error accessing private for unit testing
      const out = service.convertRowsContratos(input);
      expect(out).toHaveLength(2);

      expect(out[0]).toEqual({
        id: 1,
        projeto_id: 10,
        numero: 'C-001',
        exclusivo: true,
        processos_SEI: '123|456',
        status: 'ATIVO',
        modalidade_licitacao: { id: 9, nome: 'Tomada de Preços' },
        fontes_recurso: '100|200',
        area_gestora: { id: 7, sigla: 'SG', descricao: 'Secretaria Geral' },
        objeto: 'Obra X',
        descricao_detalhada: 'Detalhe',
        contratante: 'Governo',
        empresa_contratada: 'Construtora',
        prazo: 12,
        unidade_prazo: 'MESES',
        data_base: '01/2025',
        data_inicio: new Date('2025-01-01T00:00:00Z'),
        data_termino: new Date('2025-12-31T00:00:00Z'),
        data_termino_atualizada: new Date('2026-06-30T00:00:00Z'),
        valor: 1000,
        valor_reajustado: 1200,
        percentual_medido: 50,
        observacoes: 'Obs',
      });

      expect(out[1]).toEqual({
        id: 2,
        projeto_id: 10,
        numero: 'C-002',
        exclusivo: false,
        processos_SEI: null,
        status: 'SUSPENSO',
        modalidade_licitacao: null,
        fontes_recurso: null,
        area_gestora: null,
        objeto: null,
        descricao_detalhada: null,
        contratante: null,
        empresa_contratada: null,
        prazo: null,
        unidade_prazo: null,
        data_base: null,
        data_inicio: null,
        data_termino: null,
        data_termino_atualizada: null,
        valor: null,
        valor_reajustado: null,
        percentual_medido: null,
        observacoes: null,
      });
    });
  });

  describe('convertRowsAditivos', () => {
    it('maps DB rows to DTOs applying nullish coalescing', () => {
      const input = [
        {
          aditivo_id: 11,
          contrato_id: 1,
          tipo_aditivo_id: 5,
          tipo_aditivo_nome: 'Reajuste',
          data: new Date('2025-02-01T00:00:00Z'),
          valor_com_reajuste: 500,
          percentual_medido: 10,
          data_termino_atual: new Date('2025-12-31T00:00:00Z'),
        },
        {
          aditivo_id: 12,
          contrato_id: 1,
          tipo_aditivo_id: 6,
          tipo_aditivo_nome: 'Prorrogação',
          data: null,
          valor_com_reajuste: null,
          percentual_medido: null,
          data_termino_atual: null,
        },
      ] as any;

      // @ts-expect-error private access for unit testing
      const out = service.convertRowsAditivos(input);
      expect(out).toEqual([
        {
          id: 11,
          contrato_id: 1,
          tipo: { id: 5, nome: 'Reajuste' },
          data: new Date('2025-02-01T00:00:00Z'),
          valor_com_reajuste: 500,
          percentual_medido: 10,
          data_termino_atual: new Date('2025-12-31T00:00:00Z'),
        },
        {
          id: 12,
          contrato_id: 1,
          tipo: { id: 6, nome: 'Prorrogação' },
          data: null,
          valor_com_reajuste: null,
          percentual_medido: null,
          data_termino_atual: null,
        },
      ]);
    });
  });

  describe('convertRowsOrigens', () => {
    it('maps nullable origin fields to DTO', () => {
      const input = [
        {
          projeto_id: 99,
          pdm_id: 1,
          pdm_titulo: 'PDM',
          meta_id: 2,
          meta_titulo: 'Meta',
          iniciativa_id: 3,
          iniciativa_titulo: 'Inic',
          atividade_id: 4,
          atividade_titulo: 'Atv',
        },
        {
          projeto_id: 99,
          pdm_id: null,
          pdm_titulo: null,
          meta_id: null,
          meta_titulo: null,
          iniciativa_id: null,
          iniciativa_titulo: null,
          atividade_id: null,
          atividade_titulo: null,
        },
      ] as any;

      // @ts-expect-error private access for test
      const out = service.convertRowsOrigens(input);
      expect(out).toEqual([
        {
          projeto_id: 99,
          pdm_id: 1,
          pdm_titulo: 'PDM',
          meta_id: 2,
          meta_titulo: 'Meta',
          iniciativa_id: 3,
          iniciativa_titulo: 'Inic',
          atividade_id: 4,
          atividade_titulo: 'Atv',
        },
        {
          projeto_id: 99,
          pdm_id: null,
          pdm_titulo: null,
          meta_id: null,
          meta_titulo: null,
          iniciativa_id: null,
          iniciativa_titulo: null,
          atividade_id: null,
          atividade_titulo: null,
        },
      ]);
    });
  });

  describe('queryDataContratos/queryDataAditivos/queryDataOrigens', () => {
    it('executes raw SQL and pushes converted results (happy path)', async () => {
      const outContratos: any[] = [];
      const outAditivos: any[] = [];
      const outOrigens: any[] = [];

      prisma.$queryRawUnsafe
        .mockResolvedValueOnce([
          // contratos
          {
            id: 1, projeto_id: 10, numero: 'C-1', exclusivo: true,
            processos_sei: 's',
            status: 'ATIVO',
            modalidade_contratacao_id: null, modalidade_contratacao_nome: null,
            fontes_recurso: null,
            orgao_id: null, orgao_sigla: null, orgao_descricao: null,
            objeto: 'Obj', descricao_detalhada: 'Det', contratante: 'Ct', empresa_contratada: 'Em',
            prazo: 1, unidade_prazo: 'M', data_base: '01/2025',
            data_inicio: null, data_termino: null, data_termino_atualizada: null,
            valor: 10, valor_reajustado: 11, percentual_medido: 1, observacoes: 'o'
          },
        ])
        .mockResolvedValueOnce([
          // aditivos
          {
            aditivo_id: 2, contrato_id: 1, numero: 1, tipo_aditivo_id: 5, tipo_aditivo_nome: 'Reajuste',
            data: null, data_termino_atual: null, valor_com_reajuste: null, percentual_medido: null
          },
        ])
        .mockResolvedValueOnce([
          // origens
          {
            projeto_id: 10,
            pdm_id: null, pdm_titulo: null,
            meta_id: 3, meta_titulo: 'Meta',
            iniciativa_id: null, iniciativa_titulo: null,
            atividade_id: null, atividade_titulo: null
          },
        ]);

      // @ts-expect-error private
      await service.queryDataContratos(10, outContratos);
      // @ts-expect-error private
      await service.queryDataAditivos(10, outAditivos);
      // @ts-expect-error private
      await service.queryDataOrigens(10, outOrigens);

      expect(prisma.$queryRawUnsafe).toHaveBeenCalledTimes(3);
      expect(outContratos).toHaveLength(1);
      expect(outContratos[0]).toMatchObject({
        id: 1, projeto_id: 10, numero: 'C-1', exclusivo: true, status: 'ATIVO',
      });

      expect(outAditivos).toHaveLength(1);
      expect(outAditivos[0]).toMatchObject({
        id: 2, contrato_id: 1, tipo: { id: 5, nome: 'Reajuste' },
      });

      expect(outOrigens).toHaveLength(1);
      expect(outOrigens[0]).toMatchObject({
        projeto_id: 10, meta_id: 3, meta_titulo: 'Meta', pdm_id: null,
      });
    });

    it('propagates prisma errors (failure path)', async () => {
      prisma.$queryRawUnsafe.mockRejectedValueOnce(new Error('db fail'));

      const out: any[] = [];
      // @ts-expect-error private access
      await expect(service.queryDataContratos(10, out)).rejects.toThrow('db fail');
      expect(out).toHaveLength(0);
    });
  });

  describe('asJSON', () => {
    it('builds the JSON report by aggregating services and mapping fields', async () => {
      // Arrange: projeto detail row
      const projetoRow = mockProjetoDetail();
      projetoService.findOne.mockResolvedValueOnce(projetoRow);

      // fonte_recursos mapping: prisma.$queryRaw to resolve name by sof code
      prisma.$queryRaw.mockResolvedValue([{ descricao: 'Fonte SOF 001' }]);

      // tarefaCronograma id present
      prisma.tarefaCronograma.findFirst.mockResolvedValueOnce({ id: 777 } as any);
      tarefaService.tarefasHierarquia.mockResolvedValueOnce({ '1': '1.1' } as any);
      tarefaService.buscaLinhasRecalcProjecao.mockResolvedValueOnce({
        linhas: [
          {
            id: '1',
            tarefa: 'Atividade',
            inicio_planejado: new Date('2025-01-10T00:00:00Z'),
            termino_planejado: new Date('2025-01-20T00:00:00Z'),
            custo_estimado: 100,
            duracao_planejado: 10,
            inicio_real: null,
            termino_real: null,
            duracao_real: null,
            percentual_concluido: 0,
            custo_real: 0,
          },
        ],
      });

      // riscos
      riscoService.findAll.mockResolvedValueOnce([
        {
          codigo: 'R1',
          titulo: 'Risco 1',
          descricao: 'desc',
          probabilidade: 2,
          probabilidade_descricao: 'Média',
          impacto: 3,
          impacto_descricao: 'Alto',
          grau: 6,
          grau_descricao: 'Significativo',
          status_risco: 1,
        },
      ] as any);

      // planos de ação
      planoAcaoService.findAll.mockResolvedValueOnce([
        {
          projeto_risco: { codigo: 'R1' },
          contramedida: 'Mitigar',
          prazo_contramedida: new Date('2025-03-01T00:00:00Z'),
          responsavel: 'Alice',
          medidas_de_contingencia: 'Plano B',
        },
      ] as any);

      // acompanhamentos + encaminhamentos
      acompanhamentoService.findAll.mockResolvedValueOnce([
        {
          id: 22,
          acompanhamento_tipo: { nome: 'Reunião' },
          ordem: 1,
          data_registro: new Date('2025-01-15T00:00:00Z'),
          participantes: 'A|B',
          detalhamento: 'Detalhe',
          observacao: 'Obs',
          detalhamento_status: 'OK',
          pontos_atencao: 'Nenhum',
          pauta: 'Agenda',
          cronograma_paralisado: false,
          risco: [{ codigo: 'R1' }],
          acompanhamentos: [
            {
              numero_identificador: 5,
              encaminhamento: 'Fazer X',
              responsavel: 'Carlos',
              prazo_encaminhamento: new Date('2025-01-31T00:00:00Z'),
              prazo_realizado: null,
            },
          ],
        },
      ] as any);

      // contratos/aditivos/origens populated via private query methods;
      // we can spy and replace with stubs to focus on asJSON assembly.
      const contratos: any[] = [{ id: 1 }];
      const aditivos: any[] = [{ id: 2 }];
      const origens: any[] = [{ projeto_id: 10 }];

      // Spy on private methods
      // @ts-expect-error private access
      const qContratosSpy = jest.spyOn(service as any, 'queryDataContratos')
        .mockImplementation(async (_id: number, out: any[]) => { out.push(...contratos); });
      // @ts-expect-error private access
      const qAditivosSpy = jest.spyOn(service as any, 'queryDataAditivos')
        .mockImplementation(async (_id: number, out: any[]) => { out.push(...aditivos); });
      // @ts-expect-error private access
      const qOrigensSpy = jest.spyOn(service as any, 'queryDataOrigens')
        .mockImplementation(async (_id: number, out: any[]) => { out.push(...origens); });

      const dto: CreateRelProjetoDto = { projeto_id: 10 } as any;

      // Act
      const result = await service.asJSON(dto, { id: 123 } as unknown as PessoaFromJwt);

      // Assert
      expect(projetoService.findOne).toHaveBeenCalledWith('PP', 10, expect.anything(), 'ReadOnly');
      expect(result.detail.id).toBe(10);
      expect(result.cronograma).toHaveLength(1);
      expect(result.riscos).toHaveLength(1);
      expect(result.planos_acao).toHaveLength(1);
      expect(result.acompanhamentos).toHaveLength(1);
      expect(result.encaminhamentos).toHaveLength(1);
      expect(result.contratos).toEqual(contratos);
      expect(result.aditivos).toEqual(aditivos);
      expect(result.origens).toEqual(origens);

      expect(qContratosSpy).toHaveBeenCalled();
      expect(qAditivosSpy).toHaveBeenCalled();
      expect(qOrigensSpy).toHaveBeenCalled();
    });

    it('handles missing tarefaCronograma by returning empty cronograma and tarefas hierarchy', async () => {
      projetoService.findOne.mockResolvedValueOnce(mockProjetoDetail());
      prisma.$queryRaw.mockResolvedValue([{ descricao: 'Fonte' }]);
      prisma.tarefaCronograma.findFirst.mockResolvedValueOnce(null as any);

      riscoService.findAll.mockResolvedValueOnce([]);
      planoAcaoService.findAll.mockResolvedValueOnce([]);
      acompanhamentoService.findAll.mockResolvedValueOnce([]);

      // Stub queryData* to no-op
      jest.spyOn(service as any, 'queryDataContratos').mockResolvedValue(undefined as any);
      jest.spyOn(service as any, 'queryDataAditivos').mockResolvedValue(undefined as any);
      jest.spyOn(service as any, 'queryDataOrigens').mockResolvedValue(undefined as any);

      const dto: CreateRelProjetoDto = { projeto_id: 20 } as any;

      const result = await service.asJSON(dto, null);
      expect(result.cronograma).toEqual([]);
      expect(result.riscos).toEqual([]);
      expect(result.planos_acao).toEqual([]);
      expect(result.acompanhamentos).toEqual([]);
      expect(result.encaminhamentos).toEqual([]); // flatMap over empty array
    });
  });

  describe('toFileOutput', () => {
    function createCtxMock(): ReportContext {
      return {
        progress: jest.fn(async () => {}),
        setRestricaoAcesso: jest.fn(() => {}),
        resumoSaida: jest.fn(async () => {}),
      } as any;
    }

    it('generates CSV files and info.json, sets access restriction when user is null, and attaches EAP when available', async () => {
      // Arrange asJSON return
      const asJsonValue = {
        detail: { id: 10, portfolio_id: 42, status: 'ATIVO', nome: 'Proj A' },
        cronograma: [{ tarefa: 'A' }],
        riscos: [{ codigo: 'R1' }],
        planos_acao: [{ codigo_risco: 'R1' }],
        acompanhamentos: [],
        encaminhamentos: [],
        contratos: [{ id: 1 }],
        aditivos: [{ id: 2 }],
        origens: [{ projeto_id: 10 }],
      } as any;
      jest.spyOn(service, 'asJSON').mockResolvedValueOnce(asJsonValue);

      // prisma: portfolio orgaos for restriction
      prisma.portfolio.findFirstOrThrow.mockResolvedValueOnce({
        orgaos: [{ id: 7 }, { id: 8 }],
      } as any);

      // uploads to be included
      prisma.projetoDocumento.findMany.mockResolvedValueOnce([
        {
          id: 1,
          criado_em: new Date('2025-01-01T00:00:00Z'),
          descricao: 'Doc',
          arquivo: { id: 99, nome_original: 'orig.pdf', caminho: '/bucket/path' },
          criador: { id: 50, nome_exibicao: 'Bob' },
        },
      ] as any);

      // tarefaCronograma exists for EAP svg
      prisma.tarefaCronograma.findFirst.mockResolvedValueOnce({ id: 555 } as any);
      // tarefa service produces a Readable-like stream; Stream2Buffer is mocked to return bytes
      const fakeStream: any = { pipe: jest.fn() };
      (tarefaService.getEap as any).mockResolvedValueOnce(fakeStream);

      const ctx = createCtxMock();

      const out = await service.toFileOutput({ projeto_id: 10 } as any, ctx, null);

      // Should include info.json plus csvs and eap.svg
      const names = out.map((f) => f.name).sort();
      expect(names).toEqual(expect.arrayContaining([
        'info.json',
        'detalhes-do-projeto.csv',
        'cronograma.csv',
        'acompanhamentos.csv',
        'encaminhamentos.csv',
        'riscos.csv',
        'contratos.csv',
        'aditivos.csv',
        'origens.csv',
        'arquivos.csv',
        'eap.svg',
      ]));

      // Access restriction set for null user
      expect(ctx.setRestricaoAcesso).toHaveBeenCalledWith({
        portfolio_orgao_ids: [7, 8],
      });

      // Ensure CSV writer was called
      expect(WriteCsvToBuffer).toHaveBeenCalled();

      // Ensure ctx progress milestones were called
      expect((ctx.progress as jest.Mock).mock.calls.length).toBeGreaterThan(0);
    });

    it('skips EAP when no tarefaCronograma exists and handles empty uploads gracefully', async () => {
      jest.spyOn(service, 'asJSON').mockResolvedValueOnce({
        detail: { id: 999, portfolio_id: 1, status: null, nome: 'X' },
        cronograma: [],
        riscos: [],
        planos_acao: [],
        acompanhamentos: [],
        encaminhamentos: [],
        contratos: [],
        aditivos: [],
        origens: [],
      } as any);

      prisma.portfolio.findFirstOrThrow.mockResolvedValueOnce({ orgaos: [] } as any);
      prisma.projetoDocumento.findMany.mockResolvedValueOnce([]);
      prisma.tarefaCronograma.findFirst.mockResolvedValueOnce(null as any);

      const ctx = {
        progress: jest.fn(async () => {}),
        setRestricaoAcesso: jest.fn(() => {}),
        resumoSaida: jest.fn(async () => {}),
      } as any;

      const out = await service.toFileOutput({ projeto_id: 999 } as any, ctx, null);
      const names = out.map((f) => f.name);
      expect(names).toContain('info.json');
      expect(names).not.toContain('eap.svg'); // EAP not added
    });
  });
});

/* ------------------------ Helpers & Mocks ------------------------ */

function createPrismaMock(): jest.Mocked<PrismaService> {
  return {
    $queryRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
    tarefaCronograma: {
      findFirst: jest.fn(),
    },
    portfolio: {
      findFirstOrThrow: jest.fn(),
    },
    projetoDocumento: {
      findMany: jest.fn(),
    },
  } as any;
}

function createProjetoServiceMock(): jest.Mocked<ProjetoService> {
  return {
    findOne: jest.fn(),
  } as any;
}

function createRiscoServiceMock(): jest.Mocked<RiscoService> {
  return {
    findAll: jest.fn(),
  } as any;
}

function createPlanoAcaoServiceMock(): jest.Mocked<PlanoAcaoService> {
  return {
    findAll: jest.fn(),
  } as any;
}

function createTarefaServiceMock(): jest.Mocked<TarefaService> {
  return {
    tarefasHierarquia: jest.fn(),
    buscaLinhasRecalcProjecao: jest.fn(),
    getEap: jest.fn(),
  } as any;
}

function createAcompanhamentoServiceMock(): jest.Mocked<AcompanhamentoService> {
  return {
    findAll: jest.fn(),
  } as any;
}

function mockProjetoDetail(): any {
  return {
    id: 10,
    arquivado: false,
    origem_tipo: 'META',
    meta_id: 2,
    iniciativa_id: 3,
    atividade_id: null,
    origem_outro: null,
    portfolio_id: 42,
    meta_codigo: 'M-01',
    nome: 'Projeto A',
    status: 'ATIVO',
    resumo: 'Resumo',
    codigo: 'P-001',
    objeto: 'Obj',
    objetivo: 'Objt',
    data_aprovacao: new Date('2025-01-01T00:00:00Z'),
    data_revisao: null,
    versao: 1,
    publico_alvo: 'Todos',
    previsao_inicio: new Date('2025-02-01T00:00:00Z'),
    previsao_custo: 100,
    previsao_duracao: 12,
    previsao_termino: new Date('2026-02-01T00:00:00Z'),
    realizado_inicio: null,
    realizado_termino: null,
    realizado_custo: 0,
    nao_escopo: null,
    principais_etapas: null,
    responsavel: { id: 1, nome_exibicao: 'Gestor' },
    eh_prioritario: false,
    secretario_executivo: 'Sec',
    secretario_responsavel: 'SecR',
    coordenador_ue: 'Coord',
    atraso: 0,
    em_atraso: false,
    tolerancia_atraso: 5,
    projecao_termino: new Date('2026-01-01T00:00:00Z'),
    realizado_duracao: 0,
    percentual_concluido: 0,
    portfolio: { titulo: 'Port', nivel_maximo_tarefa: 5 },
    orgao_gestor: { id: 7, sigla: 'OG', descricao: 'Orgao Gestor' },
    orgao_responsavel: null,
    meta: 'Meta X',
    responsaveis_no_orgao_gestor: [{ nome_exibicao: 'Resp1' }, { nome_exibicao: 'Resp2' }],
    projeto_etapa: 'Etapa 1',
    fonte_recursos: [
      { fonte_recurso_ano: 2026, fonte_recurso_cod_sof: '001', valor_nominal: 100, valor_percentual: null },
    ],
    premissas: [{ premissa: 'Prem 1' }],
    restricoes: [{ restricao: 'Rest 1' }],
    orgaos_participantes: [{ sigla: 'ORG1' }, { sigla: 'ORG2' }],
  };
}

// Preserve any pre-existing content by appending below this line.
// If this file previously had content, it will be available via version control.