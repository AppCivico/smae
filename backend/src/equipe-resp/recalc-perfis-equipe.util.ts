import { PerfilResponsavelEquipe, Prisma } from '@prisma/client';

/**
 * Recalcula os campos perfis_equipe_pdm e perfis_equipe_ps de uma pessoa,
 * com base nas equipes ativas em que ela participa e nos PdmPerfil associados.
 */
export async function recalculaPessoaPdmTipos(pessoaId: number, prismaTx: Prisma.TransactionClient) {
    const equipes = await prismaTx.grupoResponsavelEquipeParticipante.findMany({
        where: {
            pessoa_id: pessoaId,
            removido_em: null,
        },
        select: { grupo_responsavel_equipe: { select: { id: true } } },
    });

    const perfisPdm = new Set<PerfilResponsavelEquipe>();
    const perfisPs = new Set<PerfilResponsavelEquipe>();

    const pdmTiposEPerfis = await prismaTx.pdm.findMany({
        where: {
            removido_em: null,
            PdmPerfil: {
                some: {
                    equipe_id: { in: equipes.map((e) => e.grupo_responsavel_equipe.id) },
                    removido_em: null,
                },
            },
        },
        select: {
            tipo: true,
            PdmPerfil: {
                select: { equipe: { select: { perfil: true } } },
                where: {
                    equipe_id: { in: equipes.map((e) => e.grupo_responsavel_equipe.id) },
                    removido_em: null,
                },
            },
        },
    });

    for (const item of pdmTiposEPerfis) {
        item.PdmPerfil.forEach((perfil) => {
            if (item.tipo === 'PDM') {
                perfisPdm.add(perfil.equipe.perfil);
            } else if (item.tipo === 'PS') {
                perfisPs.add(perfil.equipe.perfil);
            }
        });
    }

    await prismaTx.pessoa.update({
        where: { id: pessoaId },
        data: {
            perfis_equipe_pdm: Array.from(perfisPdm),
            perfis_equipe_ps: Array.from(perfisPs),
        },
    });
}

/**
 * Encontra todas as pessoas participantes ativas das equipes informadas
 * e recalcula seus perfis_equipe_pdm/perfis_equipe_ps.
 */
export async function recalcPessoasAfetadasPorEquipes(equipeIds: number[], prismaTx: Prisma.TransactionClient) {
    if (equipeIds.length === 0) return;

    const participantes = await prismaTx.grupoResponsavelEquipeParticipante.findMany({
        where: {
            grupo_responsavel_equipe_id: { in: equipeIds },
            removido_em: null,
        },
        select: { pessoa_id: true },
        distinct: ['pessoa_id'],
    });

    for (const p of participantes) {
        await recalculaPessoaPdmTipos(p.pessoa_id, prismaTx);
    }
}
