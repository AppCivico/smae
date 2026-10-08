import { criarPessoaComPrivilegios, prisma, Sessao, uniq } from '../lib';

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
