import { HttpException } from '@nestjs/common';
import { PdmPerfilRelacionamento, Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { CreatePSEquipePontoFocalDto, CreatePSEquipeTecnicoCPDto } from '../pdm/dto/create-pdm.dto';

export async function upsertPSPerfis(
    entityId: number,
    entityType: 'meta' | 'iniciativa' | 'atividade',
    newEquipes: CreatePSEquipeTecnicoCPDto | CreatePSEquipePontoFocalDto,
    tipo: 'CP' | 'PONTO_FOCAL',
    currentPdmPerfis: { id: number; tipo: string; equipe_id: number }[],
    user: PessoaFromJwt,
    prismaTx: Prisma.TransactionClient,
    pdmId: number
) {
    const currentEquipes = currentPdmPerfis.filter((p) => p.tipo === tipo).map((p) => p.equipe_id);
    const equipesToAdd = newEquipes.equipes.filter((e) => !currentEquipes.includes(e));
    const equipesToRemove = currentEquipes.filter((e) => !newEquipes.equipes.includes(e));

    for (const equipeId of equipesToRemove) {
        await prismaTx.pdmPerfil.updateMany({
            where: {
                [entityType + '_id']: entityId,
                equipe_id: equipeId,
                tipo: tipo,
            },
            data: {
                removido_em: new Date(),
                removido_por: user.id,
            },
        });
    }

    for (const equipeId of equipesToAdd) {
        const equipe = await prismaTx.grupoResponsavelEquipe.findFirst({
            where: { id: equipeId, removido_em: null },
            select: { orgao_id: true },
        });

        if (!equipe) throw new HttpException(`Equipe ${equipeId} não encontrada`, 400);

        const map: Record<typeof entityType, PdmPerfilRelacionamento> = {
            meta: 'META',
            iniciativa: 'INICIATIVA',
            atividade: 'META',
        };

        await prismaTx.pdmPerfil.create({
            data: {
                pdm_id: pdmId,
                [entityType + '_id']: entityId,
                equipe_id: equipeId,
                relacionamento: map[entityType],
                tipo: tipo,
                criado_por: user.id,
                criado_em: new Date(),
                orgao_id: equipe.orgao_id,
            },
        });
    }


}


export function validatePSEquipes(
    equipes: number[],
    pdmPerfis: { equipe: { id: number }; tipo: string }[],
    tipo: 'CP' | 'PONTO_FOCAL',
    pdmId: number
) {
    for (const equipe_id of equipes) {
        const pdmPerfil = pdmPerfis.find((r) => r.equipe.id == equipe_id && r.tipo == tipo);
        if (!pdmPerfil) {
            throw new HttpException(
                `Equipe ${equipe_id} não existe no PDM ${pdmId}: ${tipo}, aceitos: ${pdmPerfis
                    .filter((r) => r.tipo == tipo)
                    .map((r) => r.equipe.id)}`,
                400
            );
        }
    }
}