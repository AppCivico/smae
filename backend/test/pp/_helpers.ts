import { CONST_PERFIL_GESTOR_OBRA } from '../../src/common/consts';
import { api, assertStatus, criarOrgao, criarPessoaComPrivilegios, loginAsSuperAdmin, prisma, Sessao, uniq } from '../lib';

export type Tipo = 'PP' | 'MDO';

export const ROTA = {
    PP: { portfolio: '/api/portfolio', projeto: '/api/projeto', acao: '/api/projeto-acao' },
    MDO: { portfolio: '/api/portfolio-mdo', projeto: '/api/projeto-mdo', acao: '/api/projeto-acao-mdo' },
} as const;

export async function criarPortfolio(
    sessao: Sessao,
    tipo: Tipo,
    dados: Record<string, unknown> = {}
): Promise<{ id: number }> {
    const res = await api(sessao)
        .post(ROTA[tipo].portfolio)
        .send({ titulo: uniq('Portfólio'), orgaos: [sessao.pessoa.orgao_id], ...dados });
    assertStatus(res, 201);
    return res.body;
}

let lookupsMdo: Promise<{ grupo_tematico_id: number; tipo_intervencao_id: number }> | undefined;

// grupo temático e tipo de intervenção são obrigatórios em toda obra (MDO)
export function lookupsDeObra() {
    if (!lookupsMdo) {
        lookupsMdo = (async () => {
            const superadmin = await loginAsSuperAdmin();
            const criador = { criado_por: superadmin.pessoa.id };
            const grupo = await prisma().grupoTematico.create({ data: { nome: uniq('Grupo'), ...criador } });
            const tipo = await prisma().tipoIntervencao.create({ data: { nome: uniq('Intervenção'), ...criador } });
            return { grupo_tematico_id: grupo.id, tipo_intervencao_id: tipo.id };
        })();
    }
    return lookupsMdo;
}

// sessao: Projeto.administrador (PP) ou ProjetoMDO.administrador_no_orgao (MDO); órgão gestor padrão = órgão da sessão
export async function criarProjeto(sessao: Sessao, tipo: Tipo, dados: Record<string, unknown>): Promise<{ id: number }> {
    const extra = tipo === 'MDO' ? await lookupsDeObra() : {};
    const res = await api(sessao)
        .post(ROTA[tipo].projeto)
        .send({
            nome: uniq('Projeto'),
            origem_tipo: 'Outro',
            origem_outro: 'Origem e2e',
            orgao_gestor_id: sessao.pessoa.orgao_id,
            responsaveis_no_orgao_gestor: [],
            orgaos_participantes: [],
            previsao_custo: null,
            ...(tipo === 'MDO' ? { orgao_origem_id: sessao.pessoa.orgao_id } : {}),
            ...extra,
            ...dados,
        });
    assertStatus(res, 201);
    return res.body;
}

// VALIDAR_ORGAO_PORTFOLIO (true por padrão) exige esse perfil no órgão gestor de obras
export async function criarGestorDaObra(orgao_id: number): Promise<Sessao> {
    const sessao = await criarPessoaComPrivilegios(['ProjetoMDO.administrador_no_orgao'], { orgao_id });
    const db = prisma();
    let perfil = await db.perfilAcesso.findFirst({ where: { nome: CONST_PERFIL_GESTOR_OBRA } });
    if (!perfil) {
        perfil = await db.perfilAcesso.create({
            data: { nome: CONST_PERFIL_GESTOR_OBRA, descricao: 'e2e', autogerenciavel: false },
        });
    }
    await db.pessoaPerfil.create({ data: { pessoa_id: sessao.pessoa.id, perfil_acesso_id: perfil.id } });
    return sessao;
}

export async function acao(sessao: Sessao, tipo: Tipo, projeto_id: number, acao: string) {
    return api(sessao).patch(ROTA[tipo].acao).send({ acao, projeto_id });
}

export async function cenarioObras() {
    const orgao = await criarOrgao();
    await criarGestorDaObra(orgao.id);
    const portfolio = await criarPortfolio(
        await criarPessoaComPrivilegios(['ProjetoMDO.administrar_portfolios'], { orgao_id: orgao.id }),
        'MDO',
        { orgaos: [orgao.id] }
    );
    const adminMdo = await criarPessoaComPrivilegios(['ProjetoMDO.administrador_no_orgao'], { orgao_id: orgao.id });
    return { orgao, portfolio, adminMdo };
}
