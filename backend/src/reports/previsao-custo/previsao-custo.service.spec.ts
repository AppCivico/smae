import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { DateTime } from 'luxon';

import { PrevisaoCustoService } from './previsao-custo.service';
import { DotacaoService } from '../../dotacao/dotacao.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UtilsService } from '../utils/utils.service';
import { PeriodoRelatorioPrevisaoCustoDto, SuperCreateRelPrevisaoCustoDto } from './dto/create-previsao-custo.dto';
import { ReportContext } from '../relatorios/helpers/reports.contexto';
import { DefaultCsvOptions, DefaultTransforms } from '../utils/utils.service';

// Mock Date2YMD and SYSTEM_TIMEZONE to produce deterministic output in toFileOutput
jest.mock('../../common/date2ymd', () => ({
  Date2YMD: {
    tzSp2UTC: jest.fn(() => '2000-01-01T00:00:00Z'),
  },
  SYSTEM_TIMEZONE: 'UTC',
}));

// Mock CSV writer to avoid real file/stream IO
const writeCsvToFileMock = jest.fn().mockResolvedValue(undefined);
jest.mock('src/common/helpers/CsvWriter', () => ({
  WriteCsvToFile: (...args: any[]) => writeCsvToFileMock(...args),
}));

// Utility helpers
const makeRecord = (overrides: Partial<any> = {}) => ({
  id: 1,
  criador: { nome_exibicao: 'Criador XYZ' },
  meta: { id: 10, codigo: 'M01', titulo: 'Meta A' },
  atividade: { id: 30, codigo: 'AT01', titulo: 'Atividade A' },
  iniciativa: { id: 20, codigo: 'IN01', titulo: 'Iniciativa A' },
  projeto: { id: 40, codigo: 'PR01', nome: 'Projeto A' },
  versao_anterior_id: null,
  criado_em: new Date('2025-01-01T00:00:00.000Z'),
  ano_referencia: 2025,
  custo_previsto: 123.456,
  parte_dotacao: '0.*.1.2.*.3.4.*.5', // will expand * at positions 1,4,7
  atualizado_em: new Date('2025-02-02T00:00:00.000Z'),
  ...overrides,
});

describe('PrevisaoCustoService', () => {
  let service: PrevisaoCustoService;

  // Mocks for injected dependencies
  const utilsMock = {
    applyFilter: jest.fn(),
  } as unknown as jest.Mocked<UtilsService>;

  const prismaMock = {
    orcamentoPrevisto: {
      findMany: jest.fn(),
    },
    pdm: {
      findUnique: jest.fn(),
    },
  } as unknown as jest.Mocked<PrismaService>;

  const dotacaoMock = {
    setManyProjetoAtividade: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<DotacaoService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrevisaoCustoService,
        { provide: UtilsService, useValue: utilsMock },
        { provide: PrismaService, useValue: prismaMock },
        { provide: DotacaoService, useValue: dotacaoMock },
      ],
    }).compile();

    service = module.get<PrevisaoCustoService>(PrevisaoCustoService);
  });

  describe('asJSON', () => {
    it('throws if ano is not provided and periodo_ano is not Corrente', async () => {
      const dto = {} as unknown as SuperCreateRelPrevisaoCustoDto;

      await expect(service.asJSON(dto, null)).rejects.toThrow(HttpException);
      await expect(service.asJSON(dto, null)).rejects.toThrow('Ano de referência não informado');
      expect(prismaMock.orcamentoPrevisto.findMany).not.toHaveBeenCalled();
    });

    it('uses current year when periodo_ano = Corrente and transforms output correctly', async () => {
      // Arrange
      const metas = [{ id: 99 }, { id: 100 }];
      (utilsMock.applyFilter as any) = jest.fn().mockResolvedValue({ metas });

      const currentYear = 2031;
      jest.spyOn(DateTime, 'local').mockReturnValue(DateTime.fromObject({ year: currentYear, zone: 'UTC' }));

      prismaMock.orcamentoPrevisto.findMany.mockResolvedValue([makeRecord({ ano_referencia: currentYear })]);

      const dto: SuperCreateRelPrevisaoCustoDto = {
        periodo_ano: PeriodoRelatorioPrevisaoCustoDto.Corrente,
      } as any;

      // Act
      const result = await service.asJSON(dto, null);

      // Assert findMany filter based on metas and year
      expect(utilsMock.applyFilter).toHaveBeenCalledTimes(1);
      expect(prismaMock.orcamentoPrevisto.findMany).toHaveBeenCalledTimes(1);

      const callArg = prismaMock.orcamentoPrevisto.findMany.mock.calls[0][0];
      expect(callArg.where.ano_referencia).toBe(currentYear);
      expect(callArg.where.meta_id).toEqual({ in: [99, 100] });
      expect(callArg.where.removido_em).toBeNull();
      expect(callArg.where.ultima_revisao).toBe(true);

      // Assert transformation of fields
      expect(result.linhas).toHaveLength(1);
      const item = result.linhas[0];
      expect(item.custo_previsto).toBe('123.46'); // toFixed(2)
      expect(item.projeto_atividade).toBe('');
      // expandirParteDotacao: '*' at indices 1,4,7 => '**', '****', '********'
      expect(item.parte_dotacao).toBe('0.**.1.2.****.3.4.********.5');

      // dotacaoService should enrich list
      expect(dotacaoMock.setManyProjetoAtividade).toHaveBeenCalledTimes(1);
      expect(dotacaoMock.setManyProjetoAtividade).toHaveBeenCalledWith(result.linhas);
    });

    it('does not call applyFilter when projeto_id is provided and filters by projeto_id', async () => {
      // Arrange
      const projetoId = 777;
      prismaMock.orcamentoPrevisto.findMany.mockResolvedValue([makeRecord({ projeto: { id: projetoId, codigo: 'PRX', nome: 'Projeto X' } })]);

      const dto: SuperCreateRelPrevisaoCustoDto = {
        ano: 2024,
        projeto_id: projetoId,
      } as any;

      // Act
      const result = await service.asJSON(dto, null);

      // Assert
      expect(utilsMock.applyFilter).not.toHaveBeenCalled();
      expect(prismaMock.orcamentoPrevisto.findMany).toHaveBeenCalledTimes(1);

      const callArg = prismaMock.orcamentoPrevisto.findMany.mock.calls[0][0];
      expect(callArg.where.projeto_id).toBe(projetoId);
      expect(callArg.where.meta_id).toBeUndefined();

      // Output still mapped
      expect(result.linhas).toHaveLength(1);
      expect(result.linhas[0].custo_previsto).toBe('123.46');
    });
  });

  describe('toFileOutput', () => {
    const makeCtx = (): ReportContext => {
      const { PassThrough } = require('stream');
      return {
        resumoSaida: jest.fn().mockResolvedValue(undefined),
        progress: jest.fn().mockResolvedValue(undefined),
        getTmpFile: jest.fn().mockReturnValue({
          path: 'tmp/previsao-custo.csv',
          stream: new PassThrough(), // not actually written because writer is mocked
        }),
      } as any;
    };

    it('returns only info.json when there are no linhas and calls progress hooks', async () => {
      // Arrange: no results
      prismaMock.orcamentoPrevisto.findMany.mockResolvedValue([]);
      const ctx = makeCtx();

      const params: SuperCreateRelPrevisaoCustoDto = { ano: 2022 } as any;

      // Act
      const out = await service.toFileOutput(params, ctx, null);

      // Assert
      expect(ctx.resumoSaida).toHaveBeenCalledWith('Previsão de Custo', 0);
      expect(ctx.progress).toHaveBeenNthCalledWith(1, 50);
      expect(ctx.progress).toHaveBeenNthCalledWith(2, 99);

      // No CSV written
      expect(writeCsvToFileMock).not.toHaveBeenCalled();
      expect((ctx.getTmpFile as any)).not.toHaveBeenCalled();

      // Output contains info.json only
      expect(out).toHaveLength(1);
      expect(out[0].name).toBe('info.json');

      const info = JSON.parse(out[0].buffer.toString('utf8'));
      expect(info.params).toEqual(params);
      expect(info.horario).toBe('2000-01-01T00:00:00Z'); // from mocked Date2YMD
    });

    it('writes CSV with projeto fields when pdm is not provided', async () => {
      // Arrange: some data and no pdm
      prismaMock.orcamentoPrevisto.findMany.mockResolvedValue([makeRecord()]);
      prismaMock.pdm.findUnique.mockResolvedValue(undefined);

      const ctx = makeCtx();
      const params: SuperCreateRelPrevisaoCustoDto = { ano: 2025 } as any;

      // Act
      const out = await service.toFileOutput(params, ctx, null);

      // Assert hooks
      expect(ctx.resumoSaida).toHaveBeenCalledWith('Previsão de Custo', 1);
      expect(ctx.getTmpFile).toHaveBeenCalledWith('previsao-custo.csv');
      expect(writeCsvToFileMock).toHaveBeenCalledTimes(1);

      const writerArgs = writeCsvToFileMock.mock.calls[0];
      // writerArgs: [dados.linhas, reportTmp.stream, csvOptions]
      const csvOptions = writerArgs[2];
      expect(csvOptions.csvOptions).toBe(DefaultCsvOptions);
      expect(csvOptions.transforms).toBe(DefaultTransforms);

      // First part of fields should be projeto fields when pdm is undefined
      expect(csvOptions.fields.slice(0, 3)).toEqual([
        { value: 'projeto.codigo', label: 'Código Projeto' },
        { value: 'projeto.nome', label: 'Nome do Projeto' },
        { value: 'projeto.id', label: 'ID do Projeto' },
      ]);

      // The tail fields should be the fixed fields in order
      const tail = csvOptions.fields.slice(-8);
      expect(tail).toEqual([
        'id',
        'id_versao_anterior',
        'projeto_atividade',
        'criado_em',
        'ano_referencia',
        'custo_previsto',
        'parte_dotacao',
        'atualizado_em',
      ]);

      // Output should include info.json and previsao-custo.csv reference
      expect(out.find((f: any) => f.name === 'info.json')).toBeTruthy();
      const csv = out.find((f: any) => f.name === 'previsao-custo.csv');
      expect(csv).toBeTruthy();
      expect(csv.localFile).toBe('tmp/previsao-custo.csv');
    });

    it('writes CSV with PDM-labeled fields when pdm is provided', async () => {
      // Arrange: some data and a PDM with specific labels
      prismaMock.orcamentoPrevisto.findMany.mockResolvedValue([makeRecord()]);
      prismaMock.pdm.findUnique.mockResolvedValue({
        id: 1,
        rotulo_iniciativa: 'Iniciativa X',
        rotulo_atividade: 'Atividade Y',
      } as any);

      const ctx = makeCtx();
      const params: SuperCreateRelPrevisaoCustoDto = { ano: 2026, pdm_id: 1 } as any;

      // Act
      await service.toFileOutput(params, ctx, null);

      // Assert CSV fields use PDM labels
      const csvOptions = writeCsvToFileMock.mock.calls[writeCsvToFileMock.mock.calls.length - 1][2];

      // The first 9 fields when pdm is present should be meta + iniciativa + atividade with proper labels
      expect(csvOptions.fields.slice(0, 9)).toEqual([
        { value: 'meta.codigo', label: 'Código da Meta' },
        { value: 'meta.titulo', label: 'Título da Meta' },
        { value: 'meta.id', label: 'ID da Meta' },
        { value: 'iniciativa.codigo', label: 'Código da Iniciativa X' },
        { value: 'iniciativa.titulo', label: 'Título da Iniciativa X' },
        { value: 'iniciativa.id', label: 'ID da Iniciativa X' },
        { value: 'atividade.codigo', label: 'Código da Atividade Y' },
        { value: 'atividade.titulo', label: 'Título da Atividade Y' },
        { value: 'atividade.id', label: 'ID da Atividade Y' },
      ]);
    });
  });
});