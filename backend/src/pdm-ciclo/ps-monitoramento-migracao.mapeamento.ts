import * as he from 'he';
import { CONST_BOT_USER_ID } from '../common/consts';
import { MONITORAMENTO_CONFIG_DEFAULTS } from '../pdm/monitoramento-config.defaults';

export type BlocoCfgMigracao = {
    id: number;
    ordem: number;
    rotulo: string;
    criado_em: Date;
    atualizado_por: number | null;
    removido_em: Date | null;
};

export type FaseCfgMigracao = {
    id: number;
    ordem: number;
    rotulo: string;
    habilitada: boolean;
    criado_em: Date;
    criado_por: number;
    removido_em: Date | null;
    blocos: BlocoCfgMigracao[];
};

export type MapeamentoLegado = {
    qualificacao_fase_id: number | null;
    informacoes_complementares_bloco_id: number | null;
    risco_fase_id: number | null;
    detalhamento_bloco_id: number | null;
    ponto_de_atencao_bloco_id: number | null;
    fechamento_fase_id: number | null;
    comentario_bloco_id: number | null;
};

export type ConteudoLegado = {
    analises: number;
    analises_com_texto: number;
    documentos: number;
    riscos: number;
    riscos_com_detalhamento: number;
    riscos_com_ponto_de_atencao: number;
    fechamentos: number;
};

type ChaveFase = 'qualificacao_fase_id' | 'risco_fase_id' | 'fechamento_fase_id';
type ChaveBloco = Exclude<keyof MapeamentoLegado, ChaveFase>;

// posição de cada papel no lote padrão (MONITORAMENTO_CONFIG_DEFAULTS); a fase de tags não tem dado legado
const PAPEIS: { fase: ChaveFase; posicao: number; blocos: ChaveBloco[] }[] = [
    { fase: 'qualificacao_fase_id', posicao: 0, blocos: ['informacoes_complementares_bloco_id'] },
    { fase: 'risco_fase_id', posicao: 1, blocos: ['detalhamento_bloco_id', 'ponto_de_atencao_bloco_id'] },
    { fase: 'fechamento_fase_id', posicao: 3, blocos: ['comentario_bloco_id'] },
];

export function normalizaRotulo(rotulo: string): string {
    return rotulo
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

export function textoParaHtml(texto: string): string {
    return texto
        .split(/\r?\n/)
        .map((linha) => `<p>${he.escape(linha)}</p>`)
        .join('');
}

const unico = <T extends { removido_em: Date | null }>(lista: T[]): T | null => {
    const ativos = lista.filter((i) => !i.removido_em);
    if (ativos.length === 1) return ativos[0];
    if (ativos.length === 0 && lista.length === 1) return lista[0];
    return null;
};

// backfill (20260625133722) e seed criam as fases padrão com o mesmo criado_em e ids em ordem; os ids dos blocos do backfill não
export function sugereMapeamento(fases: FaseCfgMigracao[]): { mapeamento: MapeamentoLegado; avisos: string[] } {
    const mapeamento: MapeamentoLegado = {
        qualificacao_fase_id: null,
        informacoes_complementares_bloco_id: null,
        risco_fase_id: null,
        detalhamento_bloco_id: null,
        ponto_de_atencao_bloco_id: null,
        fechamento_fase_id: null,
        comentario_bloco_id: null,
    };
    const avisos: string[] = [];
    if (!fases.length) return { mapeamento, avisos };

    const porId = [...fases].sort((a, b) => a.id - b.id);
    const primeiroCriado = Math.min(...porId.map((f) => f.criado_em.getTime()));
    const lote = porId.filter((f) => f.criado_em.getTime() === primeiroCriado);
    const usadas = new Set<number>();

    for (const papel of PAPEIS) {
        const padrao = MONITORAMENTO_CONFIG_DEFAULTS[papel.posicao];
        const rotuloPadrao = normalizaRotulo(padrao.rotulo);

        let fase: FaseCfgMigracao | null = null;
        if (lote.length === MONITORAMENTO_CONFIG_DEFAULTS.length) {
            const candidata = lote[papel.posicao];
            if (candidata.criado_por === CONST_BOT_USER_ID || normalizaRotulo(candidata.rotulo) === rotuloPadrao)
                fase = candidata;
        }
        fase ??= unico(porId.filter((f) => !usadas.has(f.id) && normalizaRotulo(f.rotulo) === rotuloPadrao));
        if (!fase || usadas.has(fase.id)) continue;

        usadas.add(fase.id);
        mapeamento[papel.fase] = fase.id;
        if (fase.removido_em || !fase.habilitada)
            avisos.push(`O conteúdo de "${padrao.rotulo}" vai para a fase "${fase.rotulo}", que não é exibida`);

        const blocos = sugereBlocos(fase, padrao.blocos);
        papel.blocos.forEach((chave, idx) => {
            const bloco = blocos[idx];
            mapeamento[chave] = bloco?.id ?? null;
            if (bloco?.removido_em)
                avisos.push(
                    `O conteúdo de "${padrao.blocos[idx].rotulo}" vai para o bloco "${bloco.rotulo}", que foi removido`
                );
        });
    }

    return { mapeamento, avisos };
}

function sugereBlocos(
    fase: FaseCfgMigracao,
    padroes: { ordem: number; rotulo: string }[]
): (BlocoCfgMigracao | null)[] {
    const lote = fase.blocos.filter((b) => b.criado_em.getTime() === fase.criado_em.getTime());
    const ret: (BlocoCfgMigracao | null)[] = padroes.map(() => null);
    const usados = new Set<number>();
    const atribui = (idx: number, bloco: BlocoCfgMigracao | null | undefined) => {
        if (!bloco || ret[idx] || usados.has(bloco.id)) return;
        ret[idx] = bloco;
        usados.add(bloco.id);
    };

    padroes.forEach((p, idx) => {
        const candidatos = lote.filter((b) => normalizaRotulo(b.rotulo) === normalizaRotulo(p.rotulo));
        if (candidatos.length === 1) atribui(idx, candidatos[0]);
    });
    // sem edição desde a criação, a ordem ainda é a do padrão
    padroes.forEach((p, idx) => {
        const candidatos = lote.filter((b) => !usados.has(b.id) && b.atualizado_por === null && b.ordem === p.ordem);
        if (candidatos.length === 1) atribui(idx, candidatos[0]);
    });
    const faltam = ret.map((b, idx) => (b ? -1 : idx)).filter((idx) => idx >= 0);
    const sobram = lote.filter((b) => !usados.has(b.id));
    if (faltam.length === 1 && sobram.length === 1) atribui(faltam[0], sobram[0]);

    padroes.forEach((p, idx) => {
        atribui(
            idx,
            unico(fase.blocos.filter((b) => !usados.has(b.id) && normalizaRotulo(b.rotulo) === normalizaRotulo(p.rotulo)))
        );
    });
    return ret;
}

export function validaMapeamento(fases: FaseCfgMigracao[], m: MapeamentoLegado): string[] {
    const erros: string[] = [];
    const faseById = new Map(fases.map((f) => [f.id, f]));

    for (const papel of PAPEIS) {
        const faseId = m[papel.fase];
        if (faseId === null) {
            for (const chave of papel.blocos)
                if (m[chave] !== null) erros.push(`${chave} informado sem ${papel.fase}`);
            continue;
        }
        const fase = faseById.get(faseId);
        if (!fase) {
            erros.push(`${papel.fase}: fase ${faseId} não pertence a este plano`);
            continue;
        }
        for (const chave of papel.blocos) {
            const blocoId = m[chave];
            if (blocoId !== null && !fase.blocos.some((b) => b.id === blocoId))
                erros.push(`${chave}: bloco ${blocoId} não pertence à fase "${fase.rotulo}"`);
        }
    }

    const fasesUsadas = PAPEIS.map((p) => m[p.fase]).filter((id): id is number => id !== null);
    if (new Set(fasesUsadas).size !== fasesUsadas.length)
        erros.push('Qualificação, risco e fechamento precisam ir para fases diferentes');
    if (m.detalhamento_bloco_id !== null && m.detalhamento_bloco_id === m.ponto_de_atencao_bloco_id)
        erros.push('Detalhamento e ponto de atenção precisam ir para blocos diferentes');

    return erros;
}

export function pendenciasMapeamento(m: MapeamentoLegado, c: ConteudoLegado): string[] {
    const pendencias: string[] = [];
    if ((c.analises || c.documentos) && m.qualificacao_fase_id === null)
        pendencias.push('Sem fase de destino para a qualificação (análises e documentos)');
    if (c.analises_com_texto && m.informacoes_complementares_bloco_id === null)
        pendencias.push('Sem bloco de destino para "Informações complementares"');
    if (c.riscos && m.risco_fase_id === null) pendencias.push('Sem fase de destino para a análise de risco');
    if (c.riscos_com_detalhamento && m.detalhamento_bloco_id === null)
        pendencias.push('Sem bloco de destino para "Detalhamento"');
    if (c.riscos_com_ponto_de_atencao && m.ponto_de_atencao_bloco_id === null)
        pendencias.push('Sem bloco de destino para "Ponto de atenção"');
    if (c.fechamentos && m.fechamento_fase_id === null) pendencias.push('Sem fase de destino para o fechamento');
    return pendencias;
}

type RevisaoLegada = {
    id: number;
    meta_id: number;
    ciclo_fisico_id: number;
    ultima_revisao: boolean;
    removido_em: Date | null;
    criado_em: Date;
};

// o índice único da tabela nova aceita uma só ultima_revisao por (meta, ciclo, fase)
export function marcaUltimasRevisoes(revisoes: RevisaoLegada[]): Set<number> {
    const escolhida = new Map<string, RevisaoLegada>();
    for (const r of revisoes) {
        if (!r.ultima_revisao || r.removido_em) continue;
        const chave = `${r.meta_id}:${r.ciclo_fisico_id}`;
        const atual = escolhida.get(chave);
        const maisRecente =
            !atual ||
            r.criado_em.getTime() > atual.criado_em.getTime() ||
            (r.criado_em.getTime() === atual.criado_em.getTime() && r.id > atual.id);
        if (maisRecente) escolhida.set(chave, r);
    }
    return new Set([...escolhida.values()].map((r) => r.id));
}
