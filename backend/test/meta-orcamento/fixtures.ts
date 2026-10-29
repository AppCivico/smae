import { criarOrgao, criarPessoaComPrivilegios, prisma, Sessao, uniq } from '../lib';

// dotação com 'projeto/atividade' e 'fonte' fixos: cada cenário usa um ano próprio para não colidir
export const DOTACAO = '16.10.12.128.3011.2.180.33903600.00';

let anoSeq = 2040;
export const anoUnico = (): number => ++anoSeq;

export async function criarCenarioOrcamento(ano: number = anoUnico(), tipo: 'PDM' | 'PS' = 'PDM') {
    const db = prisma();
    const pdm = await db.pdm.create({ data: { nome: uniq(tipo), prefeito: 'Prefeito E2E', tipo } });
    await db.pdmOrcamentoConfig.create({
        data: {
            pdm_id: pdm.id,
            ano_referencia: ano,
            previsao_custo_disponivel: true,
            planejado_disponivel: true,
            execucao_disponivel: true,
        },
    });
    const meta = await db.meta.create({
        data: { pdm_id: pdm.id, status: 'Ativo', codigo: uniq('MET'), titulo: uniq('Meta') },
    });
    return { pdm, meta, ano };
}

export function criarAdminOrcamento(): Promise<Sessao> {
    return criarPessoaComPrivilegios(['CadastroMeta.administrador_orcamento', 'CadastroMeta.orcamento']);
}

export function criarDotacaoPlanejada(
    ano: number,
    valores: { atualizado: number; inicial?: number; saldo?: number; dotacao?: string }
) {
    return prisma().dotacaoPlanejado.create({
        data: {
            informacao_valida: true,
            ano_referencia: ano,
            mes_utilizado: 1,
            dotacao: valores.dotacao ?? DOTACAO,
            val_orcado_inicial: valores.inicial ?? valores.atualizado,
            val_orcado_atualizado: valores.atualizado,
            saldo_disponivel: valores.saldo ?? valores.atualizado,
        },
    });
}

export function criarDotacaoRealizada(ano: number, valores: { empenho: number; liquidado: number }) {
    return prisma().dotacaoRealizado.create({
        data: {
            informacao_valida: true,
            ano_referencia: ano,
            mes_utilizado: 12,
            dotacao: DOTACAO,
            empenho_liquido: valores.empenho,
            valor_liquidado: valores.liquidado,
        },
    });
}

export async function criarIniciativaEAtividade(meta_id: number) {
    const db = prisma();
    const iniciativa = await db.iniciativa.create({
        data: { meta_id, codigo: uniq('INI'), titulo: uniq('Iniciativa'), compoe_indicador_meta: false },
    });
    const atividade = await db.atividade.create({
        data: {
            iniciativa_id: iniciativa.id,
            codigo: uniq('ATV'),
            titulo: uniq('Atividade'),
            compoe_indicador_iniciativa: false,
        },
    });
    return { iniciativa, atividade };
}

export async function criarMetaNoPdm(pdm_id: number) {
    return prisma().meta.create({
        data: { pdm_id, status: 'Ativo', codigo: uniq('MET'), titulo: uniq('Meta') },
    });
}

export async function somaPlanejadoPdm(pdm_id: number, ano: number, dotacao: string = DOTACAO) {
    const r = await prisma().pdmDotacaoPlanejado.findUnique({
        where: { pdm_id_ano_referencia_dotacao: { pdm_id, ano_referencia: ano, dotacao } },
    });
    return r ? { soma: r.soma_valor_planejado.toFixed(2), pressao: r.pressao_orcamentaria } : null;
}

export const DOTACAO_PROJETO = '16.10.12.128.3011.1.181.33903600.00';
export const DOTACAO_OPERACAO = '16.10.12.128.3011.0.182.33903600.00';

export function semearDotacaoRealizada(
    ano: number,
    dotacao: string,
    v: { empenho: number; liquidado: number; processo?: string; nota?: string }
) {
    const base = {
        informacao_valida: true,
        mes_utilizado: 12,
        dotacao,
        empenho_liquido: v.empenho,
        valor_liquidado: v.liquidado,
    };
    const db = prisma();
    if (v.processo && v.nota) {
        const ano_nota = +v.nota.split('/')[1];
        return db.dotacaoProcessoNota.create({
            data: {
                ...base,
                ano_referencia: ano_nota,
                dotacao_processo: v.processo,
                dotacao_processo_nota: v.nota,
            },
        });
    }
    if (v.processo)
        return db.dotacaoProcesso.create({ data: { ...base, ano_referencia: ano, dotacao_processo: v.processo } });
    return db.dotacaoRealizado.create({ data: { ...base, ano_referencia: ano } });
}

// 'cp' também é responsável na meta (ponto focal), além de coordenador na CP
export async function criarPontoFocalDaMeta(meta_id: number, tipo: 'ponto_focal' | 'cp' = 'ponto_focal') {
    const orgao = await criarOrgao();
    const sessao = await criarPessoaComPrivilegios(['CadastroMeta.orcamento'], { orgao_id: orgao.id });
    const db = prisma();
    await db.metaOrgao.create({ data: { meta_id, orgao_id: orgao.id, responsavel: true } });
    const base = { meta_id, pessoa_id: sessao.pessoa.id, orgao_id: orgao.id };
    await db.metaResponsavel.create({ data: { ...base, coordenador_responsavel_cp: false } });
    if (tipo === 'cp') await db.metaResponsavel.create({ data: { ...base, coordenador_responsavel_cp: true } });
    return { sessao, orgao };
}
