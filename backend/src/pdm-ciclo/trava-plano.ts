import { HttpException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

// FOR SHARE: a edição da config (FOR NO KEY UPDATE) espera esta escrita terminar
export async function travaPlano(prismaTx: Prisma.TransactionClient, pdmId: number): Promise<void> {
    const rows = await prismaTx.$queryRaw<{ id: number }[]>`
        SELECT id FROM pdm WHERE id = ${pdmId}::int AND removido_em IS NULL FOR SHARE`;
    if (!rows.length) throw new HttpException('Plano não encontrado', 400);
}
