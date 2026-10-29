import { HttpException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const MSG_PLANO_LEGADO = 'Este plano ainda usa o monitoramento legado';
export const MSG_PLANO_POR_FASES = 'Este plano usa o monitoramento por fases configuradas';

// FOR SHARE: a migração e a edição da config (FOR NO KEY UPDATE) esperam esta escrita terminar
export async function travaPlano(prismaTx: Prisma.TransactionClient, pdmId: number, porBlocos: boolean): Promise<void> {
    const rows = await prismaTx.$queryRaw<{ monitoramento_por_blocos: boolean }[]>`
        SELECT monitoramento_por_blocos FROM pdm WHERE id = ${pdmId}::int AND removido_em IS NULL FOR SHARE`;
    if (!rows.length) throw new HttpException('Plano não encontrado', 400);
    if (rows[0].monitoramento_por_blocos !== porBlocos)
        throw new HttpException(porBlocos ? MSG_PLANO_LEGADO : MSG_PLANO_POR_FASES, 400);
}

export async function comTxPdmLegado<T>(
    prisma: PrismaService,
    pdmId: number,
    write: (prismaTx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
    return await prisma.$transaction(
        async (prismaTx: Prisma.TransactionClient) => {
            await travaPlano(prismaTx, pdmId, false);
            return await write(prismaTx);
        },
        { isolationLevel: 'Serializable', maxWait: 5000, timeout: 15000 }
    );
}

export async function escreveNoCicloLegado<T>(
    prisma: PrismaService,
    prismaCtx: Prisma.TransactionClient | undefined,
    cicloFisicoId: number,
    write: (prismaTx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
    const ciclo = await (prismaCtx ?? prisma).cicloFisico.findFirst({
        where: { id: cicloFisicoId },
        select: { pdm_id: true },
    });
    if (!ciclo?.pdm_id) throw new HttpException('Ciclo não encontrado', 400);

    if (!prismaCtx) return await comTxPdmLegado(prisma, ciclo.pdm_id, write);
    await travaPlano(prismaCtx, ciclo.pdm_id, false);
    return await write(prismaCtx);
}
