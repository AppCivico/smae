import { TarefaDependenteTipo } from '@prisma/client';

const MS_DIA = 86400000;

export interface CaminhoCriticoTarefa {
    id: number;
    tarefa_pai_id: number | null;
    nivel: number;
    inicio_planejado: Date | string | null;
    termino_planejado: Date | string | null;
    dependencias: { dependencia_tarefa_id: number; tipo: TarefaDependenteTipo; latencia: number }[];
}

export interface CaminhoCriticoItem {
    folga: number | null;
    eh_critica: boolean;
    inicio_mais_tarde: Date | null;
    termino_mais_tarde: Date | null;
}

export interface CaminhoCriticoResultado {
    por_tarefa: Map<number, CaminhoCriticoItem>;
    /** ids das tarefas folha críticas, em ordem de início planejado */
    caminho: number[];
}

function paraDia(d: Date | string | null): number | null {
    if (d === null || d === undefined) return null;
    const ms = typeof d === 'string' ? Date.parse(d.substring(0, 10) + 'T00:00:00Z') : d.getTime();
    if (Number.isNaN(ms)) return null;
    return Math.floor(ms / MS_DIA);
}

interface No {
    id: number;
    pai: No | null;
    filhos: No[];
    nivel: number;
    es: number;
    ef: number;
    ls: number;
    lf: number;
    /** início mais tarde imposto só pelas sucessoras da própria tarefa e das mães, sem contar as filhas */
    ls_externo: number;
}

/**
 * Conta de volta (datas mais tarde) sobre as datas planejadas, em dias corridos.
 * As datas planejadas já são as "mais cedo", pois o solver de dependências as calcula.
 */
export function calculaCaminhoCritico(tarefas: CaminhoCriticoTarefa[]): CaminhoCriticoResultado {
    const nos = new Map<number, No>();
    for (const t of tarefas) {
        const es = paraDia(t.inicio_planejado);
        const ef = paraDia(t.termino_planejado);
        if (es === null || ef === null) continue;
        nos.set(t.id, {
            id: t.id,
            pai: null,
            filhos: [],
            nivel: t.nivel,
            es,
            ef,
            ls: Infinity,
            lf: Infinity,
            ls_externo: Infinity,
        });
    }

    const sucessores = new Map<number, { no: No; tipo: TarefaDependenteTipo; latencia: number }[]>();
    for (const t of tarefas) {
        const no = nos.get(t.id);
        if (!no) continue;
        if (t.tarefa_pai_id !== null) {
            const pai = nos.get(t.tarefa_pai_id);
            if (pai) {
                no.pai = pai;
                pai.filhos.push(no);
            }
        }
        for (const dep of t.dependencias ?? []) {
            if (!nos.has(dep.dependencia_tarefa_id)) continue;
            const lista = sucessores.get(dep.dependencia_tarefa_id) ?? [];
            lista.push({ no, tipo: dep.tipo, latencia: dep.latencia });
            sucessores.set(dep.dependencia_tarefa_id, lista);
        }
    }

    const por_tarefa = new Map<number, CaminhoCriticoItem>();
    for (const t of tarefas) {
        if (!nos.has(t.id))
            por_tarefa.set(t.id, { folga: null, eh_critica: false, inicio_mais_tarde: null, termino_mais_tarde: null });
    }
    if (nos.size === 0) return { por_tarefa, caminho: [] };

    const todos = [...nos.values()];
    const raizes = todos.filter((n) => n.pai === null);
    const fim = Math.max(...(raizes.length ? raizes : todos).map((n) => n.ef));
    for (const n of todos) n.lf = fim;

    // relaxação até estabilizar; o grafo é acíclico, o limite só protege de dados inconsistentes
    const limite = todos.length * 2 + 10;
    for (let iter = 0; iter < limite; iter++) {
        let mudou = false;
        const aplica = (n: No, ls: number, lf: number, ls_externo: number) => {
            if (ls < n.ls) {
                n.ls = ls;
                mudou = true;
            }
            if (ls_externo < n.ls_externo) {
                n.ls_externo = ls_externo;
                mudou = true;
            }
            if (lf < n.lf) {
                n.lf = lf;
                mudou = true;
            }
        };

        for (const n of todos) {
            let ls = n.ls_externo;
            let lf = n.lf;

            for (const s of sucessores.get(n.id) ?? []) {
                switch (s.tipo) {
                    case TarefaDependenteTipo.termina_pro_inicio:
                        lf = Math.min(lf, s.no.ls - s.latencia);
                        break;
                    case TarefaDependenteTipo.inicia_pro_inicio:
                        ls = Math.min(ls, s.no.ls - s.latencia);
                        break;
                    case TarefaDependenteTipo.inicia_pro_termino:
                        ls = Math.min(ls, s.no.lf - s.latencia);
                        break;
                    case TarefaDependenteTipo.termina_pro_termino:
                        lf = Math.min(lf, s.no.lf - s.latencia);
                        break;
                }
            }

            if (n.pai) {
                lf = Math.min(lf, n.pai.lf);
                // o início da mãe é o menor início das filhas, então só a(s) filha(s) que o definem são presas
                if (n.es === n.pai.es) ls = Math.min(ls, n.pai.ls_externo);
            }
            const ls_externo = ls;

            if (n.filhos.length) {
                ls = Math.min(ls, ...n.filhos.map((f) => f.ls));
                lf = Math.min(lf, Math.max(...n.filhos.map((f) => f.lf)));
            } else {
                const duracao = n.ef - n.es;
                ls = Math.min(ls, lf - duracao);
                lf = Math.min(lf, ls + duracao);
            }

            aplica(n, ls, lf, ls_externo);
        }
        if (!mudou) break;
    }

    const folgaDe = (n: No): number => {
        if (n.filhos.length) return Math.min(...n.filhos.map(folgaDe));
        return n.lf - n.ef;
    };

    const caminho: No[] = [];
    for (const n of todos) {
        const folga = folgaDe(n);
        const eh_critica = folga <= 0;
        if (eh_critica && n.filhos.length === 0) caminho.push(n);
        por_tarefa.set(n.id, {
            folga,
            eh_critica,
            inicio_mais_tarde: Number.isFinite(n.ls) ? new Date(n.ls * MS_DIA) : null,
            termino_mais_tarde: new Date(n.lf * MS_DIA),
        });
    }

    caminho.sort((a, b) => a.es - b.es || a.ef - b.ef || a.nivel - b.nivel || a.id - b.id);

    return { por_tarefa, caminho: caminho.map((n) => n.id) };
}
