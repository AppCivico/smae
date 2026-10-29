import { HttpException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

// FOR SHARE: espera a migração para fases (FOR NO KEY UPDATE) terminar antes de decidir
async function travaPdmLegado(prismaTx: Prisma.TransactionClient, cicloFisicoId: number): Promise<void> {
    const rows = await prismaTx.$queryRaw<{ monitoramento_por_blocos: boolean }[]>`
        SELECT p.monitoramento_por_blocos FROM pdm p
        JOIN ciclo_fisico cf ON cf.pdm_id = p.id
        WHERE cf.id = ${cicloFisicoId}::int
        FOR SHARE OF p`;
    if (rows[0]?.monitoramento_por_blocos)
        throw new HttpException('Este plano usa o monitoramento por fases configuradas', 400);
}

export async function escreveNoPdmLegado<T>(
    prisma: PrismaService,
    prismaCtx: Prisma.TransactionClient | undefined,
    cicloFisicoId: number,
    write: (prismaTx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
    if (prismaCtx) {
        await travaPdmLegado(prismaCtx, cicloFisicoId);
        return write(prismaCtx);
    }

    return prisma.$transaction(
        async (prismaTx: Prisma.TransactionClient) => {
            await travaPdmLegado(prismaTx, cicloFisicoId);
            return write(prismaTx);
        },
        {
            isolationLevel: 'Serializable',
            maxWait: 5000,
            timeout: 5000,
        }
    );
}
