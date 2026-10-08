import { CONST_VAR_SEM_UN_MEDIDA } from '../../src/common/consts';
import { api, assertStatus, Sessao, uniq } from '../lib';

export interface SerieItem {
    data_valor: string;
    referencia: string;
    valor_nominal: string;
}

export interface SerieCorpo {
    linhas: { periodo: string; series: SerieItem[] }[];
}

/** Série agrupada por período; a referência começa com o tipo: 'P_' Previsto, 'R_' Realizado. */
export function valorDaSerie(corpo: SerieCorpo, periodo: string, prefixo: 'P_' | 'R_'): SerieItem | undefined {
    for (const linha of corpo.linhas) {
        const achado = linha.series.find((s) => s.data_valor === periodo && s.referencia.startsWith(prefixo));
        if (achado) return achado;
    }
    return undefined;
}

export function novaGlobal(orgao_id: number, extra: Record<string, unknown> = {}) {
    return {
        titulo: uniq('Variável global'),
        orgao_proprietario_id: orgao_id,
        periodicidade: 'Mensal',
        acumulativa: false,
        casas_decimais: 2,
        unidade_medida_id: CONST_VAR_SEM_UN_MEDIDA,
        valor_base: '0',
        inicio_medicao: '2024-01-01',
        fim_medicao: '2024-03-01',
        ...extra,
    };
}

export async function criaGlobal(
    sessao: Sessao,
    orgao_id: number,
    extra: Record<string, unknown> = {}
): Promise<number> {
    const res = await api(sessao).post('/api/variavel').send(novaGlobal(orgao_id, extra));
    assertStatus(res, 201);
    return res.body.id;
}
