import { criarPdmAntigo, criarPessoaComPrivilegios, prisma, Sessao } from '../lib';

export type PerfilCp = 'PDM.admin_cp' | 'PDM.tecnico_cp' | 'PDM.ponto_focal';

export const DATA_CICLO = '2024-01-01';

/** PDM ativo com ciclo físico ativo: sem isso o perfil de acesso nunca é gravado. */
export async function ativaCicloFisico(): Promise<{ pdm_id: number; ciclo_id: number }> {
    const pdm = await criarPdmAntigo();
    await prisma().pdm.update({ where: { id: pdm.id }, data: { ativo: true } });
    const ciclo = await prisma().cicloFisico.create({
        data: { pdm_id: pdm.id, data_ciclo: new Date(DATA_CICLO), ativo: true, tipo: 'PDM' },
    });
    return { pdm_id: pdm.id, ciclo_id: ciclo.id };
}

export function criarPessoaCp(perfil: PerfilCp): Promise<Sessao> {
    return criarPessoaComPrivilegios([perfil]);
}

/** Sem ciclo a função SQL só marca a pessoa como válida, sem perfil: marcar antes evita ~14s de retry. */
export async function criarPessoaCpSemCiclo(perfil: PerfilCp): Promise<Sessao> {
    const pessoa = await criarPessoaCp(perfil);
    await prisma().pessoaAcessoPdmValido.create({ data: { pessoa_id: pessoa.pessoa.id } });
    return pessoa;
}
