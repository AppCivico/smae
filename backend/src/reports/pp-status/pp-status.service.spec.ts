/* eslint-disable @typescript-eslint/no-explicit-any */

// NOTE: Testing framework: Jest with @nestjs/testing (NestJS standard).
// These tests focus on PPStatusService: asJSON mapping, parameter validation, buscaProjetos interaction,
// and toFileOutput behavior including file naming and info.json contents.

import { Test } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { PassThrough, Writable } from 'stream';
import { PPStatusService } from './pp-status.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateRelProjetoStatusDto } from './dto/create-projeto-status.dto';
import type { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';

// Mock external dependencies and helpers
jest.mock('../../pp/projeto/projeto.service', () => ({
  ProjetoGetPermissionSet: jest.fn(async (_tipo: any, _user: any) => ({ AND: [{ mocked: true }] })),
}));

// Date2YMD tz conversion mocked for deterministic output
jest.mock('../../common/date2ymd', () => ({
  Date2YMD: {
    tzSp2UTC: jest.fn(() => '2025-01-01T00:00:00.000Z'),
  },
}));

// Csv writer mocked to avoid actual IO
jest.mock('src/common/helpers/CsvWriter', () => ({
  WriteCsvToFile: jest.fn(async (_rows: any[], stream: Writable, _opts: any) => {
    // Simulate writing a CSV header to assert stream usage if needed
    stream.write('id,nome\n');
    stream.end();
  }),
}));

describe('PPStatusService', () => {
  let service: PPStatusService;
  let prisma: { projeto: { findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      projeto: { findMany: jest.fn() },
    } as any;

    const moduleRef = await Test.createTestingModule({
      providers: [
        PPStatusService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(PPStatusService);
  });

  describe('asJSON', () => {
    const baseDto = (): CreateRelProjetoStatusDto => ({
      portfolio_id: 10,
      // tipo_pdm intentionally omitted to test defaulting to 'PP'
    } as any);

    const makeRow = (overrides: Partial<any> = {}) => ({
      id: 1,
      codigo: 'PRJ-001',
      portfolio_id: 10,
      nome: 'Projeto Alpha',
      previsao_custo: 1000,
      orgao_responsavel: { sigla: 'ORG' },
      TarefaCronograma: [],
      ProjetoAcompanhamento: [],
      ...overrides,
    });

    it('throws when no portfolio_id', async () => {
      await expect(
        service.asJSON({} as any, null)
      ).rejects.toEqual(new HttpException('Faltando portfolio_id', 400));
    });

    it('throws when no project rows are returned', async () => {
      prisma.projeto.findMany.mockResolvedValueOnce([]);
      await expect(service.asJSON(baseDto(), null)).rejects.toEqual(
        new HttpException('Não há linhas para estas condições.', 400)
      );
    });

    it('maps cronograma as "Paralisado" when cronograma_paralisado is true', async () => {
      prisma.projeto.findMany.mockResolvedValueOnce([
        makeRow({
          ProjetoAcompanhamento: [{ detalhamento: null, pontos_atencao: null, cronograma_paralisado: true }],
          TarefaCronograma: [{ em_atraso: false, realizado_custo: null, previsao_custo: null, Tarefa: [] }],
        }),
      ]);
      const res = await service.asJSON(baseDto(), null);
      expect(res.linhas).toHaveLength(1);
      expect(res.linhas[0].cronograma).toBe('Paralisado');
      expect(res.linhas[0].previsao_custo).toBeNull(); // tarefaCrono.previsao_custo and r.previsao_custo null => null
      expect(res.linhas[0].realizado_custo).toBeNull();
    });

    it('maps cronograma as "Atrasado" when any tarefa cronograma is delayed and not paralisado', async () => {
      prisma.projeto.findMany.mockResolvedValueOnce([
        makeRow({
          ProjetoAcompanhamento: [{ detalhamento: 'det', pontos_atencao: 'pt', cronograma_paralisado: false }],
          TarefaCronograma: [{ em_atraso: true, realizado_custo: 300, previsao_custo: 500, Tarefa: [] }],
        }),
      ]);
      const res = await service.asJSON(baseDto(), null);
      expect(res.linhas[0].cronograma).toBe('Atrasado');
      expect(res.linhas[0].previsao_custo).toBe(500); // prefer tarefaCrono.previsao_custo
      expect(res.linhas[0].realizado_custo).toBe(300);
      expect(res.linhas[0].detalhamento).toBe('det');
      expect(res.linhas[0].pontos_atencao).toBe('pt');
      expect(res.linhas[0].orgao_responsavel_sigla).toBe('ORG');
    });

    it('maps cronograma as "Em dia" in default case and falls back to projeto previsao_custo', async () => {
      prisma.projeto.findMany.mockResolvedValueOnce([
        makeRow({
          previsao_custo: 999,
          ProjetoAcompanhamento: [],
          TarefaCronograma: [{ em_atraso: false, realizado_custo: null, previsao_custo: null, Tarefa: [] }],
        }),
      ]);
      const res = await service.asJSON(baseDto(), null);
      expect(res.linhas[0].cronograma).toBe('Em dia');
      expect(res.linhas[0].previsao_custo).toBe(999); // fallback to row previsao_custo
      expect(res.linhas[0].realizado_custo).toBeNull();
    });

    it('sets tarefas to null when there is no TarefaCronograma', async () => {
      prisma.projeto.findMany.mockResolvedValueOnce([
        makeRow({
          TarefaCronograma: [],
        }),
      ]);
      const res = await service.asJSON(baseDto(), null);
      expect(res.linhas[0].tarefas).toBeNull();
    });

    it('builds tarefas string with statuses: Concluída | Em andamento | Não iniciada', async () => {
      const now = new Date();
      prisma.projeto.findMany.mockResolvedValueOnce([
        makeRow({
          TarefaCronograma: [
            {
              em_atraso: false,
              realizado_custo: null,
              previsao_custo: null,
              Tarefa: [
                { tarefa: 'T1', inicio_real: null, termino_real: now }, // Concluída
                { tarefa: 'T2', inicio_real: now, termino_real: null }, // Em andamento
                { tarefa: 'T3', inicio_real: null, termino_real: null }, // Não iniciada
              ],
            },
          ],
        }),
      ]);
      const res = await service.asJSON(baseDto(), null);
      expect(res.linhas[0].tarefas).toBe('T1=Concluída/T2=Em andamento/T3=Não iniciada');
    });

    it('when user is provided, ensures permission set is applied via ProjetoGetPermissionSet', async () => {
      const { ProjetoGetPermissionSet } = jest.requireMock('../../pp/projeto/projeto.service') as {
        ProjetoGetPermissionSet: jest.Mock;
      };

      prisma.projeto.findMany.mockResolvedValueOnce([makeRow()]);
      const user: PessoaFromJwt = {
        id: 123,
        modulo_sistema: [{ id: 1 } as any],
      } as any;

      await service.asJSON(baseDto(), user);
      expect(ProjetoGetPermissionSet).toHaveBeenCalledWith('PP', user);
      expect(prisma.projeto.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.anything(),
        }),
      }));
    });
  });

  describe('toFileOutput', () => {
    // Reuse a simple row mapping
    const rows = [
      {
        id: 1,
        portfolio_id: 10,
        codigo: 'PRJ-001',
        nome: 'Projeto Alpha',
        previsao_custo: 1000,
        realizado_custo: 250,
        cronograma: 'Em dia',
        orgao_responsavel_sigla: 'ORG',
        detalhamento: null,
        pontos_atencao: null,
        tarefas: 'T1=Concluída',
      },
    ];

    const baseDto = (): CreateRelProjetoStatusDto => ({
      portfolio_id: 10,
      tipo_pdm: 'PP',
    } as any);

    const mockCtx = () => {
      const stream = new PassThrough();
      const chunks: Buffer[] = [];
      stream.on('data', (c) => chunks.push(c));
      return {
        resumoSaida: jest.fn().mockResolvedValue(undefined),
        progress: jest.fn().mockResolvedValue(undefined),
        getTmpFile: jest.fn(() => ({
          stream,
          path: '/tmp/mock.csv',
          // expose buffer capture for assertions
          __chunks: chunks,
        })),
      };
    };

    it('returns info.json and projeto-status.csv for tipo_pdm "PP"', async () => {
      // Mock asJSON to avoid re-testing mapping; focus on file outputs
      const spy = jest.spyOn(service, 'asJSON').mockResolvedValue({ linhas: rows } as any);

      const ctx: any = mockCtx();
      const out = await service.toFileOutput(baseDto(), ctx, null);

      expect(spy).toHaveBeenCalled();
      expect(ctx.resumoSaida).toHaveBeenCalledWith('Projeto Status', rows.length);
      expect(ctx.progress).toHaveBeenCalledWith(50);
      expect(ctx.progress).toHaveBeenCalledWith(99);

      // Expect two outputs total (info.json + CSV)
      expect(out).toHaveLength(2);
      const info = out.find((f: any) => f.name === 'info.json');
      const csv = out.find((f: any) => f.name === 'projeto-status.csv');

      expect(info).toBeDefined();
      expect(csv).toBeDefined();
      expect(csv.localFile).toBe('/tmp/mock.csv');

      const infoJson = JSON.parse(info!.buffer.toString('utf8'));
      expect(infoJson.params).toEqual(baseDto());
      expect(infoJson.horario).toBe('2025-01-01T00:00:00.000Z');
    });

    it('returns obra-status.csv for tipo_pdm not equal to "PP"', async () => {
      jest.spyOn(service, 'asJSON').mockResolvedValue({ linhas: rows } as any);
      const ctx: any = mockCtx();
      const out = await service.toFileOutput({ portfolio_id: 10, tipo_pdm: 'OBRA' } as any, ctx, null);
      const csv = out.find((f: any) => f.name === 'obra-status.csv');
      expect(csv).toBeDefined();
    });
  });
});
