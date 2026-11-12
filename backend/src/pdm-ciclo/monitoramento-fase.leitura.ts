import { Prisma } from '@prisma/client';
import { CONST_BOT_USER_ID } from '../common/consts';
import { Date2YMD } from '../common/date2ymd';
import { Html2Text } from '../common/Html2Text';
import {
    MonitoramentoFaseDocumentoLeituraDto,
    MonitoramentoFaseLeituraDto,
    MonitoramentoFaseRevisaoLeituraDto,
    PsCicloFaseConfigDto,
    PsCicloFaseConteudoBlocoDto,
} from './entities/ps-ciclo-fase.entity';
import { calculaEstadoCiclo } from './ps-ciclo-fase.estado';

const TAMANHO_LOTE = 1000;

export const SelectFaseConfig = {
    id: true,
    ordem: true,
    rotulo: true,
    habilitada: true,
    aceita_tags: true,
    aceita_anexos: true,
    blocos: {
        where: { removido_em: null },
        orderBy: { ordem: 'asc' as const },
        select: { id: true, ordem: true, rotulo: true, habilitado: true },
    },
} satisfies Prisma.PdmMonitoramentoFaseConfigSelect;

export type FaseConfig = Prisma.PdmMonitoramentoFaseConfigGetPayload<{ select: typeof SelectFaseConfig }>;

export const SelectRevisaoLeitura = {
    id: true,
    meta_id: true,
    fase_config_id: true,
    fecha_ciclo: true,
    comentario_sistema: true,
    referencia_data: true,
    criado_em: true,
    criado_por: true,
    reaberto_em: true,
    criador: { select: { id: true, nome_exibicao: true } },
    reabridor: { select: { id: true, nome_exibicao: true } },
    blocos: {
        select: { bloco_config_id: true, conteudo: true, bloco_config: { select: { rotulo: true, ordem: true } } },
    },
    tags: { select: { tag: { select: { id: true, descricao: true } } } },
} satisfies Prisma.MetaMonitoramentoFaseSelect;

type RevisaoLeitura = Prisma.MetaMonitoramentoFaseGetPayload<{ select: typeof SelectRevisaoLeitura }>;

type ConteudoBloco = RevisaoLeitura['blocos'][number];

export type MonitoramentoFasesDaMeta = {
    meta_id: number;
    ciclo_fechado: boolean;
    ciclo_reaberto: boolean;
    fases: MonitoramentoFaseLeituraDto[];
};

export async function carregaFasesConfig(prisma: Prisma.TransactionClient, pdmId: number): Promise<FaseConfig[]> {
    return await prisma.pdmMonitoramentoFaseConfig.findMany({
        where: { pdm_id: pdmId, removido_em: null },
        orderBy: { ordem: 'asc' },
        select: SelectFaseConfig,
    });
}

export function faseConfigDto(fase: FaseConfig, faseFechamentoId: number | null): PsCicloFaseConfigDto {
    return {
        id: fase.id,
        ordem: fase.ordem,
        rotulo: fase.rotulo,
        aceita_tags: fase.aceita_tags,
        aceita_anexos: fase.aceita_anexos,
        fecha_ciclo: fase.id === faseFechamentoId,
        blocos: fase.blocos.filter((b) => b.habilitado).map((b) => ({ id: b.id, ordem: b.ordem, rotulo: b.rotulo })),
    };
}

export function blocosVisiveisDto(blocos: ConteudoBloco[], visiveis: Set<number>): PsCicloFaseConteudoBlocoDto[] {
    return blocos
        .filter((b) => visiveis.has(b.bloco_config_id))
        .sort((a, b) => a.bloco_config.ordem - b.bloco_config.ordem)
        .map((b) => ({
            bloco_id: b.bloco_config_id,
            rotulo: b.bloco_config.rotulo,
            conteudo: b.conteudo,
            conteudo_texto: Html2Text(b.conteudo),
        }));
}

function revisaoLeituraDto(
    r: RevisaoLeitura,
    blocosVisiveis: Set<number>,
    aceitaTags: boolean
): MonitoramentoFaseRevisaoLeituraDto {
    return {
        id: r.id,
        fecha_ciclo: r.fecha_ciclo,
        automatico: r.criado_por === CONST_BOT_USER_ID,
        comentario_sistema: r.comentario_sistema,
        referencia_data: Date2YMD.toString(r.referencia_data),
        criado_em: r.criado_em,
        criador: r.criador,
        reaberto_em: r.reaberto_em,
        reaberto_por: r.reabridor,
        blocos: blocosVisiveisDto(r.blocos, blocosVisiveis),
        tags: aceitaTags
            ? r.tags
                  .map((t) => ({ id: t.tag.id, descricao: t.tag.descricao }))
                  .sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR'))
            : [],
    };
}

function agrupaPorMeta<T extends { meta_id: number }>(linhas: T[]): Map<number, T[]> {
    const out = new Map<number, T[]>();
    for (const linha of linhas) {
        const lista = out.get(linha.meta_id);
        if (lista) lista.push(linha);
        else out.set(linha.meta_id, [linha]);
    }
    return out;
}

// Mesmas regras de visibilidade do buscaFases: só fases e blocos habilitados aparecem
export async function leMonitoramentoFases(
    prisma: Prisma.TransactionClient,
    pdmId: number,
    cicloFisicoId: number,
    metaIds: number[]
): Promise<Map<number, MonitoramentoFasesDaMeta>> {
    const ids = [...new Set(metaIds)];
    const out = new Map<number, MonitoramentoFasesDaMeta>();
    for (const id of ids) out.set(id, { meta_id: id, ciclo_fechado: false, ciclo_reaberto: false, fases: [] });
    if (!ids.length) return out;

    const [pdm, ciclo] = await Promise.all([
        prisma.pdm.findFirst({ where: { id: pdmId, removido_em: null }, select: { id: true } }),
        prisma.cicloFisico.findFirst({ where: { id: cicloFisicoId, pdm_id: pdmId }, select: { ativo: true } }),
    ]);
    if (!pdm || !ciclo) return out;

    const fases = await carregaFasesConfig(prisma, pdmId);
    if (!fases.length) return out;

    const revisoes: RevisaoLeitura[] = [];
    const documentos: (MonitoramentoFaseDocumentoLeituraDto & { meta_id: number; fase_config_id: number })[] = [];
    for (let i = 0; i < ids.length; i += TAMANHO_LOTE) {
        const lote = ids.slice(i, i + TAMANHO_LOTE);
        const [revs, docs] = await Promise.all([
            prisma.metaMonitoramentoFase.findMany({
                where: {
                    meta_id: { in: lote },
                    ciclo_fisico_id: cicloFisicoId,
                    ultima_revisao: true,
                    removido_em: null,
                },
                select: SelectRevisaoLeitura,
            }),
            prisma.metaMonitoramentoFaseDocumento.findMany({
                where: { meta_id: { in: lote }, ciclo_fisico_id: cicloFisicoId, removido_em: null },
                orderBy: [{ criado_em: 'asc' }, { id: 'asc' }],
                select: {
                    id: true,
                    meta_id: true,
                    fase_config_id: true,
                    descricao: true,
                    arquivo: { select: { nome_original: true } },
                },
            }),
        ]);
        revisoes.push(...revs);
        for (const d of docs) {
            documentos.push({
                id: d.id,
                meta_id: d.meta_id,
                fase_config_id: d.fase_config_id,
                descricao: d.descricao,
                nome_original: d.arquivo.nome_original,
            });
        }
    }

    const habilitadas = fases.filter((f) => f.habilitada);
    const blocosVisiveis = new Set(habilitadas.flatMap((f) => f.blocos.filter((b) => b.habilitado).map((b) => b.id)));
    const revisoesPorMeta = agrupaPorMeta(revisoes);
    const documentosPorMeta = agrupaPorMeta(documentos);

    for (const item of out.values()) {
        const daMeta = revisoesPorMeta.get(item.meta_id) ?? [];
        const docsDaMeta = documentosPorMeta.get(item.meta_id) ?? [];
        const estado = calculaEstadoCiclo(ciclo.ativo, fases, daMeta);

        item.ciclo_fechado = estado.fechado;
        item.ciclo_reaberto = estado.reaberto;
        item.fases = habilitadas.map((fase) => {
            const atual = daMeta.find((r) => r.fase_config_id === fase.id);
            return {
                config: faseConfigDto(fase, estado.faseFechamentoId),
                revisao: atual ? revisaoLeituraDto(atual, blocosVisiveis, fase.aceita_tags) : null,
                documentos: docsDaMeta
                    .filter((d) => d.fase_config_id === fase.id)
                    .map((d) => ({ id: d.id, descricao: d.descricao, nome_original: d.nome_original })),
            };
        });
    }

    return out;
}
