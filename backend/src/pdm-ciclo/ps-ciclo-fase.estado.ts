export type FaseEstadoCfg = {
    id: number;
    ordem: number;
    habilitada: boolean;
};

export type RevisaoEstado = {
    fase_config_id: number;
    fecha_ciclo: boolean;
    reaberto_em: Date | null;
};

export type EstadoCiclo = {
    fechado: boolean;
    reaberto: boolean;
    cicloEditavel: boolean;
    faseFechamentoId: number | null;
    preenchidas: number[];
    editaveis: number[];
};

// `ultimas` inclui revisões de fases já removidas da config: um fechamento nelas continua fechando o ciclo
export function calculaEstadoCiclo(cicloAtivo: boolean, fases: FaseEstadoCfg[], ultimas: RevisaoEstado[]): EstadoCiclo {
    const habilitadas = fases.filter((f) => f.habilitada).sort((a, b) => a.ordem - b.ordem);
    const comRevisao = new Set(ultimas.map((r) => r.fase_config_id));

    const fechado = ultimas.some((r) => r.fecha_ciclo && !r.reaberto_em);
    const reaberto = !fechado && ultimas.some((r) => r.fecha_ciclo && r.reaberto_em);
    const cicloEditavel = !fechado && (cicloAtivo || reaberto);

    const editaveis: number[] = [];
    if (cicloEditavel) {
        for (const fase of habilitadas) {
            editaveis.push(fase.id);
            if (!comRevisao.has(fase.id)) break;
        }
    }

    return {
        fechado,
        reaberto,
        cicloEditavel,
        faseFechamentoId: habilitadas.length ? habilitadas[habilitadas.length - 1].id : null,
        preenchidas: habilitadas.filter((f) => comRevisao.has(f.id)).map((f) => f.id),
        editaveis,
    };
}
