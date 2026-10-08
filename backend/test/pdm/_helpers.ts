import { ListaDePrivilegios } from '../../src/common/ListaDePrivilegios';
import { api, assertStatus, criarPessoaComPrivilegios, prisma, Sessao, uniq } from '../lib';

const PRIVILEGIOS_LEGADO: ListaDePrivilegios[] = [
    'CadastroMeta.administrador_no_pdm',
    'CadastroMeta.administrador_no_pdm_admin_cp',
    'CadastroMeta.listar',
    'CadastroPdm.editar',
];

export const gestorPS = (): Promise<Sessao> => criarPessoaComPrivilegios(['CadastroPS.administrador']);

export const gestorPDM = (): Promise<Sessao> => criarPessoaComPrivilegios(['CadastroPDM.administrador']);

export const gestorLegado = (): Promise<Sessao> => criarPessoaComPrivilegios(PRIVILEGIOS_LEGADO);

export function responsaveisLegado(g: Sessao) {
    return {
        orgaos_participantes: [{ orgao_id: g.pessoa.orgao_id, responsavel: true, participantes: [g.pessoa.id] }],
        coordenadores_cp: [g.pessoa.id],
    };
}

export async function criarMetaLegado(g: Sessao, pdm_id: number, dados: Record<string, unknown> = {}): Promise<number> {
    const res = await api(g)
        .post('/api/meta')
        .send({ codigo: uniq('MT'), titulo: uniq('Meta'), pdm_id, ...responsaveisLegado(g), ...dados });
    assertStatus(res, 201);
    return res.body.id;
}

export async function criarMetaPS(
    g: Sessao,
    pdm_id: number,
    sistema: 'PlanoSetorial' | 'ProgramaDeMetas' = 'PlanoSetorial',
    dados: Record<string, unknown> = {}
): Promise<number> {
    const res = await api(g, { sistema })
        .post('/api/plano-setorial-meta')
        .send({ codigo: uniq('MT'), titulo: uniq('Meta'), pdm_id, ...dados });
    assertStatus(res, 201);
    return res.body.id;
}

export async function criarIniciativaLegado(
    g: Sessao,
    meta_id: number,
    dados: Record<string, unknown> = {}
): Promise<number> {
    const res = await api(g)
        .post('/api/iniciativa')
        .send({
            codigo: uniq('INI'),
            titulo: uniq('Iniciativa'),
            meta_id,
            compoe_indicador_meta: false,
            ...responsaveisLegado(g),
            ...dados,
        });
    assertStatus(res, 201);
    return res.body.id;
}

export async function criarAtividadeLegado(
    g: Sessao,
    iniciativa_id: number,
    dados: Record<string, unknown> = {}
): Promise<number> {
    const res = await api(g)
        .post('/api/atividade')
        .send({
            codigo: uniq('ATV'),
            titulo: uniq('Atividade'),
            iniciativa_id,
            compoe_indicador_iniciativa: false,
            ...responsaveisLegado(g),
            ...dados,
        });
    assertStatus(res, 201);
    return res.body.id;
}

export async function criarIndicadorLegado(
    g: Sessao,
    meta_id: number,
    dados: Record<string, unknown> = {}
): Promise<number> {
    const res = await api(g)
        .post('/api/indicador')
        .send({
            codigo: uniq('IND'),
            titulo: uniq('Indicador'),
            polaridade: 'Positiva',
            periodicidade: 'Anual',
            regionalizavel: false,
            casas_decimais: 2,
            inicio_medicao: '2025-01-01',
            fim_medicao: '2025-12-31',
            meta_id,
            ...dados,
        });
    assertStatus(res, 201);
    return res.body.id;
}

/** Só pode haver um cronograma com ativo = true no banco (índice único parcial cronograma_ativo_idx). */
export async function liberaCronogramas(): Promise<void> {
    await prisma().cronograma.updateMany({ where: { ativo: true }, data: { ativo: false } });
}

export async function criarCronogramaLegado(
    g: Sessao,
    meta_id: number,
    dados: Record<string, unknown> = {}
): Promise<number> {
    await liberaCronogramas();
    const res = await api(g)
        .post('/api/cronograma')
        .send({ meta_id, regionalizavel: false, ...dados });
    assertStatus(res, 201);
    return res.body.id;
}
