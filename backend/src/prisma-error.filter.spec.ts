import { Prisma } from '@prisma/client';
import { ehErroDeValorInvalido, PrismaErrorFilter, PrismaValidationErrorFilter } from './prisma-error.filter';

const erro = (code: string, sqlState?: string) =>
    new Prisma.PrismaClientKnownRequestError('x', {
        code,
        clientVersion: 'test',
        meta: sqlState ? { driverAdapterError: { cause: { originalCode: sqlState } } } : undefined,
    });

const host = () => {
    const res: any = { status: jest.fn(() => res), json: jest.fn() };
    const h: any = { switchToHttp: () => ({ getResponse: () => res, getRequest: () => ({ url: '/x' }) }) };
    return { h, res };
};

describe('PrismaErrorFilter: valor inválido', () => {
    it('reconhece códigos e SQLSTATE classe 22', () => {
        for (const c of ['P2000', 'P2020', 'P2023', 'P2033']) expect(ehErroDeValorInvalido(erro(c))).toBe(true);
        expect(ehErroDeValorInvalido(erro('P2010', '22021'))).toBe(true);
        expect(ehErroDeValorInvalido(erro('P2039', '22021'))).toBe(true);
        expect(ehErroDeValorInvalido(erro('P2010', '2201W'))).toBe(true);
        expect(ehErroDeValorInvalido(erro('P2010', '42601'))).toBe(false);
        expect(ehErroDeValorInvalido(erro('P2010'))).toBe(false);
    });

    it('responde 400 para SQLSTATE 22 e 500 para erro de SQL', () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const filter = new PrismaErrorFilter();
        (filter as any).logger = { error: jest.fn() };

        const a = host();
        filter.catch(erro('P2010', '22P02'), a.h);
        expect(a.res.status).toHaveBeenCalledWith(400);

        const b = host();
        filter.catch(erro('P2010', '42601'), b.h);
        expect(b.res.status).toHaveBeenCalledWith(500);
    });

    it('PrismaClientValidationError vira 400', () => {
        const filter = new PrismaValidationErrorFilter();
        (filter as any).logger = { error: jest.fn() };
        const { h, res } = host();
        filter.catch(new Prisma.PrismaClientValidationError('Invalid Date', { clientVersion: 'test' }), h);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});
