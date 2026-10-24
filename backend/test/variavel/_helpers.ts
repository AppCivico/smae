import { CONST_VAR_SEM_UN_MEDIDA } from '../../src/common/consts';
import { RefreshIndicadorService } from '../../src/task/refresh_indicador/refresh-indicador.service';
import { RefreshVariavelService } from '../../src/task/refresh_variavel/refresh-variavel.service';
import { api, assertStatus, getApp, prisma, Sessao, uniq } from '../lib';

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

export async function tokenDaSerie(
    sessao: Sessao,
    path: string,
    periodo: string,
    prefixo: 'P_' | 'R_'
): Promise<string> {
    const res = await api(sessao).get(path);
    assertStatus(res, 200);
    const item = valorDaSerie(res.body as SerieCorpo, periodo, prefixo);
    if (!item) throw new Error(`sem token ${prefixo} para ${periodo} em ${path}`);
    return item.referencia;
}

export async function gravaSerie(
    sessao: Sessao,
    patchPath: string,
    seriePath: string,
    valores: { periodo: string; tipo: 'P_' | 'R_'; valor: string }[]
) {
    const res = await api(sessao).get(seriePath);
    assertStatus(res, 200);
    const envio = valores.map((v) => {
        const item = valorDaSerie(res.body as SerieCorpo, v.periodo, v.tipo);
        if (!item) throw new Error(`sem token ${v.tipo} para ${v.periodo} em ${seriePath}`);
        return { referencia: item.referencia, valor: v.valor };
    });
    assertStatus(await api(sessao).patch(patchPath).send({ valores: envio }), 204);
}

/** Valores de serie_variavel de uma série, por data (YYYY-MM-DD). */
export async function serieVariavelDb(variavel_id: number, serie: string): Promise<Record<string, number>> {
    const linhas = await prisma().serieVariavel.findMany({
        where: { variavel_id, serie: serie as never },
        orderBy: { data_valor: 'asc' },
    });
    return Object.fromEntries(linhas.map((l) => [l.data_valor.toISOString().slice(0, 10), Number(l.valor_nominal)]));
}

export async function serieIndicadorDb(indicador_id: number, serie: string): Promise<Record<string, number>> {
    const linhas = await prisma().serieIndicador.findMany({
        where: { indicador_id, serie: serie as never },
        orderBy: { data_valor: 'asc' },
    });
    return Object.fromEntries(linhas.map((l) => [l.data_valor.toISOString().slice(0, 10), Number(l.valor_nominal)]));
}

/** Executa a tarefa 'refresh_indicador' pendente na fila, como o worker faz (as crons ficam desligadas nos testes). */
export async function processaFilaIndicador(indicador_id: number): Promise<number> {
    const pendentes = await prisma().$queryRaw<{ id: number }[]>`
        SELECT id FROM task_queue
        WHERE type = 'refresh_indicador' AND status = 'pending' AND (params->>'indicador_id')::int = ${indicador_id}::int
        ORDER BY id`;
    for (const t of pendentes) {
        await getApp().get(RefreshIndicadorService).executeJob({ indicador_id }, String(t.id));
        await prisma().$executeRaw`UPDATE task_queue SET status = 'completed' WHERE id = ${t.id}::int`;
    }
    return pendentes.length;
}

/** Executa as tarefas 'refresh_variavel' pendentes (variável calculada). */
export async function processaFilaVariavel(variavel_id: number): Promise<number> {
    const pendentes = await prisma().$queryRaw<{ id: number }[]>`
        SELECT id FROM task_queue
        WHERE type = 'refresh_variavel' AND status = 'pending' AND (params->>'variavel_id')::int = ${variavel_id}::int
        ORDER BY id`;
    for (const t of pendentes) {
        await getApp().get(RefreshVariavelService).executeJob({ variavel_id }, String(t.id));
        await prisma()
            .$executeRaw`UPDATE task_queue SET status = 'completed' WHERE id = ${t.id}::int AND status = 'pending'`;
    }
    return pendentes.length;
}
