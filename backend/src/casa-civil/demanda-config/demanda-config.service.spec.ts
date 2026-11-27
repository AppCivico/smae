// `PrismaService` e `UploadService` arrastam módulos ESM que o jest deste projeto não transforma.
jest.mock('../../prisma/prisma.service', () => ({ PrismaService: class PrismaService {} }));
jest.mock('../../upload/upload.service', () => ({ UploadService: class UploadService {} }));

import { HttpException } from '@nestjs/common';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { DemandaConfigService } from './demanda-config.service';
import { CreateDemandaConfigDto } from './dto/create-demanda-config.dto';

type Row = {
    id: number;
    data_inicio_vigencia: Date;
    data_fim_vigencia: Date | null;
    ativo: boolean | null;
    removido_em: Date | null;
    [k: string]: unknown;
};

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);
const ymd = (v: Date | null) => (v ? v.toISOString().slice(0, 10) : null);

function matchField(value: any, cond: any): boolean {
    if (cond === null) return value === null || value === undefined;
    if (cond instanceof Date) return value instanceof Date && value.getTime() === cond.getTime();
    if (typeof cond !== 'object') return value === cond;
    if ('not' in cond && value === cond.not) return false;
    if ('notIn' in cond && cond.notIn.includes(value)) return false;
    if (value === null || value === undefined) return !('gte' in cond || 'lte' in cond || 'lt' in cond);
    if ('gte' in cond && !(value >= cond.gte)) return false;
    if ('lte' in cond && !(value <= cond.lte)) return false;
    if ('lt' in cond && !(value < cond.lt)) return false;
    return true;
}

function matches(row: Row, where: any = {}): boolean {
    return Object.entries(where).every(([k, cond]) => {
        if (k === 'AND') return (cond as any[]).every((c) => matches(row, c));
        if (k === 'OR') return (cond as any[]).some((c) => matches(row, c));
        return matchField(row[k], cond);
    });
}

function fakePrisma(rows: Row[]) {
    let nextId = Math.max(0, ...rows.map((r) => r.id)) + 1;
    const ordenar = (list: Row[], orderBy?: any) =>
        orderBy?.data_inicio_vigencia
            ? [...list].sort(
                  (a, b) =>
                      (a.data_inicio_vigencia.getTime() - b.data_inicio_vigencia.getTime()) *
                      (orderBy.data_inicio_vigencia === 'desc' ? -1 : 1)
              )
            : list;

    const demandaConfig = {
        findFirst: async ({ where, orderBy }: any) => ordenar(rows.filter((r) => matches(r, where)), orderBy)[0] ?? null,
        findMany: async ({ where, orderBy }: any) => ordenar(rows.filter((r) => matches(r, where)), orderBy),
        count: async ({ where }: any) => rows.filter((r) => matches(r, where)).length,
        update: async ({ where, data }: any) => {
            const row = rows.find((r) => r.id === where.id)!;
            Object.assign(row, data);
            return row;
        },
        create: async ({ data }: any) => {
            const row = { removido_em: null, data_fim_vigencia: null, ...data, id: nextId++ } as Row;
            rows.push(row);
            return { id: row.id };
        },
    };
    const txn = { demandaConfig, demandaConfigArquivo: { create: jest.fn(), updateMany: jest.fn() } };
    return { ...txn, $transaction: (fn: (t: any) => Promise<any>) => fn(txn) };
}

const USER = { id: 1 } as PessoaFromJwt;

function dto(inicio: string, fim: string | null): CreateDemandaConfigDto {
    return {
        data_inicio_vigencia: d(inicio),
        data_fim_vigencia: fim ? d(fim) : null,
        valor_minimo_custeio: '1',
        valor_maximo_custeio: '10',
        valor_minimo_investimento: '1',
        valor_maximo_investimento: '10',
    };
}

function row(id: number, inicio: string, fim: string | null, ativo: boolean | null): Row {
    return { id, data_inicio_vigencia: d(inicio), data_fim_vigencia: fim ? d(fim) : null, ativo, removido_em: null };
}

function setup(rows: Row[]) {
    const service = new DemandaConfigService(fakePrisma(rows) as never, {} as never);
    const ativos = () => rows.filter((r) => r.ativo === true && r.removido_em === null).map((r) => r.id);
    return { service, rows, ativos };
}

describe('DemandaConfigService.create', () => {
    it('config que começa depois da ativa a substitui e fecha a vigência dela', async () => {
        const { service, rows, ativos } = setup([row(1, '2026-05-06', null, true)]);

        const { id } = await service.create(dto('2026-12-01', null), USER);

        expect(ativos()).toEqual([id]);
        expect(rows[0].removido_em).toBeNull();
        expect(ymd(rows[0].data_fim_vigencia)).toBe('2026-11-30');
    });

    it('config histórica sem sobreposição entra inativa e não mexe na ativa', async () => {
        const { service, rows, ativos } = setup([row(1, '2026-05-06', null, true)]);

        const { id } = await service.create(dto('2024-01-01', '2024-12-31'), USER);

        expect(ativos()).toEqual([1]);
        expect(rows.find((r) => r.id === id)!.ativo).toBeNull();
        expect(rows[0].removido_em).toBeNull();
        expect(rows[0].data_fim_vigencia).toBeNull();
    });

    it.each([
        ['sem data fim', '2024-01-01', null],
        ['que invade a vigência da ativa', '2024-01-01', '2026-06-01'],
        ['com mesmo início da ativa', '2026-05-06', '2026-06-01'],
    ])('recusa config anterior %s', async (_desc, inicio, fim) => {
        const { service, rows, ativos } = setup([row(1, '2026-05-06', null, true)]);

        await expect(service.create(dto(inicio, fim), USER)).rejects.toThrow(HttpException);

        expect(rows).toHaveLength(1);
        expect(ativos()).toEqual([1]);
        expect(rows[0].removido_em).toBeNull();
        expect(rows[0].data_fim_vigencia).toBeNull();
    });

    it('recusa nova config que sobrepõe um histórico', async () => {
        const { service } = setup([row(1, '2024-01-01', '2024-12-31', null), row(2, '2026-05-06', null, true)]);

        await expect(service.create(dto('2023-06-01', '2024-02-01'), USER)).rejects.toThrow(HttpException);
    });

    it('primeira config entra ativa', async () => {
        const { service, ativos } = setup([]);

        const { id } = await service.create(dto('2026-01-01', null), USER);

        expect(ativos()).toEqual([id]);
    });
});

describe('DemandaConfigService.remove', () => {
    it('remover a ativa mais recente reativa a anterior com vigência aberta', async () => {
        const { service, rows, ativos } = setup([
            row(1, '2025-01-01', '2026-05-05', null),
            row(2, '2026-05-06', null, true),
        ]);

        await service.remove(2, USER);

        expect(ativos()).toEqual([1]);
        expect(rows[0].data_fim_vigencia).toBeNull();
    });

    it('remover o histórico mais antigo não mexe na ativa nem em datas', async () => {
        const { service, rows, ativos } = setup([
            row(1, '2024-01-01', '2024-12-31', null),
            row(2, '2025-01-01', '2026-05-05', null),
            row(3, '2026-05-06', null, true),
        ]);

        await service.remove(1, USER);

        expect(ativos()).toEqual([3]);
        expect(ymd(rows[1].data_fim_vigencia)).toBe('2026-05-05');
    });

    it('remover ativa que não é a mais recente não ativa outra nem limpa data fim', async () => {
        const { service, rows, ativos } = setup([
            row(1, '2024-01-01', '2024-12-31', true),
            row(2, '2025-01-01', '2025-12-31', null),
        ]);

        await service.remove(1, USER);

        expect(ativos()).toEqual([]);
        expect(ymd(rows[1].data_fim_vigencia)).toBe('2025-12-31');
    });
});
