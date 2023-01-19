import { Injectable } from '@nestjs/common';
import { Date2YMD } from '../../common/date2ymd';
import { DotacaoService } from '../../dotacao/dotacao.service';
import { PrismaService } from '../../prisma/prisma.service';

import { DefaultCsvOptions, FileOutput, ReportableService, UtilsService } from '../utils/utils.service';
import { CreateOrcamentoExecutadoDto } from './dto/create-orcamento-executado.dto';
import { ListOrcamentoExecutadoDto, OrcamentoExecutadoSaidaDto, OrcamentoPlanejadoSaidaDto } from './entities/orcamento-executado.entity';

const { Parser, transforms: { flatten } } = require('json2csv');
const defaultTransform = [flatten({ paths: [] })];

class RetornoRealizadoDb {
    plan_dotacao_ano_utilizado: string | null
    plan_dotacao_mes_utilizado: string | null
    plan_sof_val_orcado_atualizado: string | null
    plan_valor_planejado: string | null
    plan_dotacao_sincronizado_em: Date | null
    dotacao: string
    processo: string | null
    nota_empenho: string | null
    dotacao_valor_empenhado: string
    dotacao_valor_liquidado: string
    dotacao_mes_utilizado: string | null
    dotacao_ano_utilizado: string | null
    dotacao_sincronizado_em: string
    meta_id: string
    meta_codigo: string
    meta_titulo: string
    iniciativa_id: string
    iniciativa_codigo: string
    iniciativa_titulo: string
    atividade_id: string
    atividade_codigo: string
    atividade_titulo: string
    ano: string
    mes: string
    mes_corrente: boolean
    smae_valor_empenhado: string
    smae_valor_liquidado: string
    total_registros?: number
    orcamento_realizado_item_id?: number
}

class RetornoPlanejadoDb {
    plan_dotacao_ano_utilizado: string | null
    plan_dotacao_mes_utilizado: string | null
    plan_sof_val_orcado_atualizado: string
    plan_valor_planejado: string
    plan_dotacao_sincronizado_em: Date | null
    dotacao: string

    meta_id: string
    meta_codigo: string
    meta_titulo: string

    iniciativa_id: string
    iniciativa_codigo: string
    iniciativa_titulo: string

    atividade_id: string
    atividade_codigo: string
    atividade_titulo: string
    ano: string

    total_registros?: number
    orcamento_planejado_id?: number
}

@Injectable()
export class OrcamentoService implements ReportableService {
    constructor(
        private readonly utils: UtilsService,
        private readonly prisma: PrismaService,
        private readonly dotacaoService: DotacaoService
    ) { }

    async create(dto: CreateOrcamentoExecutadoDto): Promise<ListOrcamentoExecutadoDto> {

        const anoIni = Date2YMD.toString(dto.inicio).substring(0, 4);
        const anoFim = Date2YMD.toString(dto.fim).substring(0, 4);

        const { metas } = await this.utils.applyFilter(dto, { iniciativas: false, atividades: false });

        const orgaoMatch: any[] = [];
        if (Array.isArray(dto.orgaos) && dto.orgaos.length > 0)
            for (const orgao of dto.orgaos) {
                orgaoMatch.push({
                    dotacao: {
                        startsWith: orgao + '.',
                    }
                });
            }

        const search = await this.prisma.orcamentoRealizadoItem.findMany({
            where: {
                sobrescrito_em: null,
                OrcamentoRealizado: {
                    meta_id: { in: metas.map(r => r.id) },
                    removido_em: null,
                    'OR': orgaoMatch.length === 0 ? undefined : orgaoMatch,
                },
                data_referencia: {
                    gte: Date2YMD.tzSp2UTC(dto.inicio),
                    lte: Date2YMD.tzSp2UTC(dto.fim),
                }
            },
            select: { id: true }
        });

        const retExecutado: OrcamentoExecutadoSaidaDto[] = [];
        const retPlanejado: OrcamentoPlanejadoSaidaDto[] = [];

        if ((dto.tipo == 'Analitico') && search.length > 0) {
            const resultadosRealizado: RetornoRealizadoDb[] = await this.queryAnaliticoExecutado(search);
            for (const r of resultadosRealizado) {
                retExecutado.push(this.convertRealizadoRow(r))
            }

            const resultadosPlanejados = await this.queryAnaliticoPlanejado(anoIni, anoFim);
            for (const r of resultadosPlanejados) {
                retPlanejado.push(this.convertPlanejadoRow(r))
            }

        } else if ((dto.tipo == 'Consolidado') && search.length > 0) {
            const resultados: RetornoRealizadoDb[] = await this.queryConsolidadoExecutado(search);

            for (const r of resultados) {
                retExecutado.push(this.convertRealizadoRow(r))
            }

            const resultadosPlanejados = await this.queryConsolidadoPlanejado(anoIni, anoFim);
            for (const r of resultadosPlanejados) {
                retPlanejado.push(this.convertPlanejadoRow(r))
            }
        }

        await this.dotacaoService.setManyOrgaoUnidadeFonte(retExecutado);
        await this.dotacaoService.setManyOrgaoUnidadeFonte(retPlanejado);

        return {
            linhas: retExecutado,
            linhas_planejado: retPlanejado
        };

    }


    private async queryConsolidadoPlanejado(ano_ini: string, ano_fim: string): Promise<RetornoPlanejadoDb[]> {
        return await this.prisma.$queryRaw`
            with previsoes as (
                select
                    op.dotacao,
                    op.valor_planejado as plan_valor_planejado,
                    op.ano_referencia as ano,

                    op.meta_id,
                    m.codigo as meta_codigo,
                    m.titulo as meta_titulo,

                    op.iniciativa_id,
                    mi.codigo as iniciativa_codigo,
                    mi.titulo as iniciativa_titulo,

                    op.atividade_id,
                    ma.codigo as atividade_codigo,
                    ma.titulo as atividade_titulo

                from orcamento_planejado op
                left join meta m on m.id = meta_id
                left join iniciativa mi on mi.id = iniciativa_id
                left join atividade ma on ma.id = atividade_id

                where op.ano_referencia >= ${ano_ini}::int
                and op.ano_referencia <= ${ano_fim}::int
                and op.removido_em is null
            )
            select
                dp.ano_referencia as plan_dotacao_ano_utilizado,
                dp.mes_utilizado as plan_dotacao_mes_utilizado,
                to_char_numeric(dp.val_orcado_atualizado::numeric) as plan_sof_val_orcado_atualizado,
                dp.sincronizado_em as plan_dotacao_sincronizado_em,

                previsoes.dotacao,
                previsoes.ano,
                previsoes.meta_id,
                previsoes.meta_codigo,
                previsoes.meta_titulo,
                previsoes.iniciativa_id,
                previsoes.iniciativa_codigo,
                previsoes.iniciativa_titulo,
                previsoes.atividade_id,
                previsoes.atividade_codigo,
                previsoes.atividade_titulo,

                to_char_numeric(sum(previsoes.plan_valor_planejado)::numeric) as plan_valor_planejado,
                count(1) as total_registros
            from previsoes
            left join dotacao_planejado dp ON previsoes.dotacao = dp.dotacao AND previsoes.ano = dp.ano_referencia
            GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15
            order by previsoes.dotacao, 1, 2
            `;
    }

    private async queryAnaliticoPlanejado(ano_ini: string, ano_fim: string): Promise<RetornoPlanejadoDb[]> {
        return await this.prisma.$queryRaw`
            with previsoes as (
                select
                    op.dotacao,
                    to_char_numeric(op.valor_planejado::numeric) as plan_valor_planejado,
                    op.ano_referencia as ano,

                    op.meta_id,
                    m.codigo as meta_codigo,
                    m.titulo as meta_titulo,

                    op.iniciativa_id,
                    mi.codigo as iniciativa_codigo,
                    mi.titulo as iniciativa_titulo,

                    op.atividade_id,
                    ma.codigo as atividade_codigo,
                    ma.titulo as atividade_titulo,

                    op.id as orcamento_planejado_id
                from orcamento_planejado op
                left join meta m on m.id = meta_id
                left join iniciativa mi on mi.id = iniciativa_id
                left join atividade ma on ma.id = atividade_id

                where op.ano_referencia >= ${ano_ini}::int
                and op.ano_referencia <= ${ano_fim}::int
                and op.removido_em is null
            )
            select
                dp.ano_referencia as plan_dotacao_ano_utilizado,
                dp.mes_utilizado as plan_dotacao_mes_utilizado,
                to_char_numeric(dp.val_orcado_atualizado::numeric) as plan_sof_val_orcado_atualizado,
                dp.sincronizado_em as plan_dotacao_sincronizado_em,

                previsoes.*

            from previsoes
            left join dotacao_planejado dp ON previsoes.dotacao = dp.dotacao AND previsoes.ano = dp.ano_referencia
            order by previsoes.dotacao, 1, 2
            `;
    }

    private async queryConsolidadoExecutado(search: { id: number; }[]): Promise<RetornoRealizadoDb[]> {
        return await this.prisma.$queryRaw`
            with custos as (
                select
                o.dotacao,
                    o.processo,
                    o.nota_empenho,
                    i.valor_empenho as smae_valor_empenhado,
                    i.valor_liquidado as smae_valor_liquidado,
                    i.mes,
                    o.ano_referencia as ano,

                    o.meta_id,
                    m.codigo as meta_codigo,
                    m.titulo as meta_titulo,

                    o.iniciativa_id,
                    mi.codigo as iniciativa_codigo,
                    mi.titulo as iniciativa_titulo,

                    o.atividade_id,
                    ma.codigo as atividade_codigo,
                    ma.titulo as atividade_titulo,

                    i.id as orcamento_realizado_item_id
                from orcamento_realizado_item i
                join orcamento_realizado o on o.id = i.orcamento_realizado_id
                left join meta m on m.id = meta_id
                left join iniciativa mi on mi.id = iniciativa_id
                left join atividade ma on ma.id = atividade_id

                where i.id = ANY(${search.map(r => r.id)}::int[])
                and i.mes_corrente = TRUE
            ), analitico as (
            select
                dp.ano_referencia as plan_dotacao_ano_utilizado,
                dp.mes_utilizado as plan_dotacao_mes_utilizado,
                to_char_numeric(dp.val_orcado_atualizado::numeric) as plan_sof_val_orcado_atualizado,
                to_char_numeric(op.valor_planejado::numeric) as plan_valor_planejado,
                dp.sincronizado_em as plan_dotacao_sincronizado_em,

                custos.*,

                coalesce(dn.empenho_liquido, drp.empenho_liquido, dr.empenho_liquido) as dotacao_valor_empenhado,
                coalesce(dn.valor_liquidado, drp.valor_liquidado, dr.valor_liquidado) as dotacao_valor_liquidado,
                coalesce(dn.mes_utilizado, drp.mes_utilizado, dr.mes_utilizado) as dotacao_mes_utilizado,
                coalesce(dn.ano_referencia, drp.ano_referencia, dr.ano_referencia) as dotacao_ano_utilizado,
                coalesce(dn.sincronizado_em, drp.sincronizado_em, dr.sincronizado_em) as dotacao_sincronizado_em

            from custos
            left join orcamento_planejado op ON custos.processo IS NULL
                AND ( custos.dotacao = op.dotacao AND custos.ano = op.ano_referencia)
            left join dotacao_planejado dp ON custos.processo IS NULL
                AND ( custos.dotacao = dp.dotacao AND custos.ano = dp.ano_referencia)

                left join dotacao_realizado dr ON custos.processo IS NULL
                AND ( custos.dotacao = dr.dotacao AND custos.ano = dr.ano_referencia)

                left join dotacao_processo drp ON custos.processo IS NOT NULL AND custos.nota_empenho IS NULL
                AND ( custos.dotacao = drp.dotacao AND custos.ano = drp.ano_referencia AND custos.processo = drp.dotacao_processo)

                left join dotacao_processo_nota dn ON custos.nota_empenho IS NOT NULL
                AND ( custos.dotacao = dn.dotacao AND custos.ano = dn.ano_referencia AND custos.processo = dn.dotacao_processo  AND custos.nota_empenho = dn.dotacao_processo_nota)
            )
            select
                plan_dotacao_ano_utilizado,
                plan_dotacao_mes_utilizado,
                plan_sof_val_orcado_atualizado,
                plan_valor_planejado,
                plan_dotacao_sincronizado_em,
                dotacao,
                processo,
                nota_empenho,
                dotacao_valor_empenhado,
                dotacao_valor_liquidado,
                dotacao_mes_utilizado,
                dotacao_ano_utilizado,
                dotacao_sincronizado_em,
                meta_id,
                meta_codigo,
                meta_titulo,
                iniciativa_id,
                iniciativa_codigo,
                iniciativa_titulo,
                atividade_id,
                atividade_codigo,
                atividade_titulo,
                '' as ano,
                '' as mes,
                to_char_numeric(sum (smae_valor_empenhado)::numeric) as smae_valor_empenhado,
                to_char_numeric(sum (smae_valor_liquidado)::numeric) as smae_valor_liquidado,
                count(1) as total_registros
            FROM analitico
            GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24
            order by analitico.dotacao, analitico.processo, analitico.nota_empenho, 1, 2
            `;
    }

    private async queryAnaliticoExecutado(search: { id: number; }[]): Promise<RetornoRealizadoDb[]> {
        return await this.prisma.$queryRaw`
            with custos as (
                select
                    o.dotacao,
                    o.processo,
                    o.nota_empenho,
                    to_char_numeric(i.valor_empenho::numeric) as smae_valor_empenhado,
                    to_char_numeric(i.valor_liquidado::numeric) as smae_valor_liquidado,
                    i.mes,
                    o.ano_referencia as ano,

                    o.meta_id,
                    m.codigo as meta_codigo,
                    m.titulo as meta_titulo,

                    o.iniciativa_id,
                    mi.codigo as iniciativa_codigo,
                    mi.titulo as iniciativa_titulo,

                    o.atividade_id,
                    ma.codigo as atividade_codigo,
                    ma.titulo as atividade_titulo,

                    i.id as orcamento_realizado_item_id,
                    i.mes_corrente
                from orcamento_realizado_item i
                join orcamento_realizado o on o.id = i.orcamento_realizado_id
                left join meta m on m.id = meta_id
                left join iniciativa mi on mi.id = iniciativa_id
                left join atividade ma on ma.id = atividade_id

                where i.id = ANY(${search.map(r => r.id)}::int[])
            )
            select
                dp.ano_referencia as plan_dotacao_ano_utilizado,
                dp.mes_utilizado as plan_dotacao_mes_utilizado,
                to_char_numeric(dp.val_orcado_atualizado::numeric) as plan_sof_val_orcado_atualizado,
                to_char_numeric(op.valor_planejado::numeric) as plan_valor_planejado,
                dp.sincronizado_em as plan_dotacao_sincronizado_em,

                custos.*,

                coalesce(dn.empenho_liquido, drp.empenho_liquido, dr.empenho_liquido) as dotacao_valor_empenhado,
                coalesce(dn.valor_liquidado, drp.valor_liquidado, dr.valor_liquidado) as dotacao_valor_liquidado,
                coalesce(dn.mes_utilizado, drp.mes_utilizado, dr.mes_utilizado) as dotacao_mes_utilizado,
                coalesce(dn.ano_referencia, drp.ano_referencia, dr.ano_referencia) as dotacao_ano_utilizado,
                coalesce(dn.sincronizado_em, drp.sincronizado_em, dr.sincronizado_em) as dotacao_sincronizado_em

            from custos
            left join orcamento_planejado op ON custos.processo IS NULL
                AND ( custos.dotacao = op.dotacao AND custos.ano = op.ano_referencia)
            left join dotacao_planejado dp ON custos.processo IS NULL
                AND ( custos.dotacao = dp.dotacao AND custos.ano = dp.ano_referencia)

                left join dotacao_realizado dr ON custos.processo IS NULL
                AND ( custos.dotacao = dr.dotacao AND custos.ano = dr.ano_referencia)

                left join dotacao_processo drp ON custos.processo IS NOT NULL AND custos.nota_empenho IS NULL
                AND ( custos.dotacao = drp.dotacao AND custos.ano = drp.ano_referencia AND custos.processo = drp.dotacao_processo)

                left join dotacao_processo_nota dn ON custos.nota_empenho IS NOT NULL
                AND ( custos.dotacao = dn.dotacao AND custos.ano = dn.ano_referencia AND custos.processo = dn.dotacao_processo  AND custos.nota_empenho = dn.dotacao_processo_nota)
                order by custos.dotacao, custos.processo, custos.nota_empenho, 1, 2
            `;
    }



    private convertPlanejadoRow(db: RetornoPlanejadoDb): OrcamentoPlanejadoSaidaDto {
        const logs: string[] = [];

        if ("total_registros" in db && db.total_registros) {
            logs.push(`Total de Itens Consolidados ${db.total_registros}`)
        }
        if ("orcamento_planejado_id" in db && db.orcamento_planejado_id) {
            logs.push(`orcamento_planejado_id = ${db.orcamento_planejado_id}`)
        }

        return {
            meta: { codigo: db.meta_codigo, titulo: db.meta_titulo, id: +db.meta_id },
            iniciativa: db.iniciativa_id ? { codigo: db.iniciativa_codigo, titulo: db.iniciativa_titulo, id: +db.iniciativa_id } : null,
            atividade: db.atividade_id ? { codigo: db.atividade_codigo, titulo: db.atividade_titulo, id: +db.atividade_id } : null,

            dotacao: db.dotacao,

            orgao: { codigo: '', nome: '' },
            unidade: { codigo: '', nome: '' },
            fonte: { codigo: '', nome: '' },

            plan_dotacao_sincronizado_em: db.plan_dotacao_sincronizado_em?.toISOString() ?? '',
            plan_sof_val_orcado_atualizado: db.plan_sof_val_orcado_atualizado,
            plan_valor_planejado: db.plan_valor_planejado,
            plan_dotacao_ano_utilizado: db.plan_dotacao_ano_utilizado?.toString() ?? '',
            plan_dotacao_mes_utilizado: db.plan_dotacao_mes_utilizado?.toString() ?? '',

            ano: db.ano,

            logs: logs
        }

    }


    private convertRealizadoRow(db: RetornoRealizadoDb): OrcamentoExecutadoSaidaDto {
        const logs: string[] = [];

        if ("total_registros" in db && db.total_registros) {
            logs.push(`Total de Itens Consolidados ${db.total_registros}`)
        }

        if ("orcamento_realizado_item_id" in db && db.orcamento_realizado_item_id) {
            logs.push(`orcamento_realizado_item_id = ${db.orcamento_realizado_item_id}`)
        }

        return {
            meta: { codigo: db.meta_codigo, titulo: db.meta_titulo, id: +db.meta_id },
            iniciativa: db.iniciativa_id ? { codigo: db.iniciativa_codigo, titulo: db.iniciativa_titulo, id: +db.iniciativa_id } : null,
            atividade: db.atividade_id ? { codigo: db.atividade_codigo, titulo: db.atividade_titulo, id: +db.atividade_id } : null,

            dotacao: db.dotacao,
            processo: db.processo,
            nota_empenho: db.nota_empenho,

            orgao: { codigo: '', nome: '' },
            unidade: { codigo: '', nome: '' },
            fonte: { codigo: '', nome: '' },

            plan_dotacao_sincronizado_em: db.plan_dotacao_sincronizado_em ? db.plan_dotacao_sincronizado_em.toISOString() : null,
            plan_sof_val_orcado_atualizado: db.plan_sof_val_orcado_atualizado,
            plan_valor_planejado: db.plan_valor_planejado,
            plan_dotacao_ano_utilizado: db.plan_dotacao_ano_utilizado?.toString() || null,
            plan_dotacao_mes_utilizado: db.plan_dotacao_mes_utilizado?.toString() || null,

            dotacao_sincronizado_em: db.dotacao_sincronizado_em,
            dotacao_valor_empenhado: db.dotacao_valor_empenhado,
            dotacao_valor_liquidado: db.dotacao_valor_liquidado,
            dotacao_ano_utilizado: db.dotacao_ano_utilizado?.toString() ?? '',
            dotacao_mes_utilizado: db.dotacao_mes_utilizado?.toString() ?? '',
            smae_valor_empenhado: db.smae_valor_empenhado,
            smae_valor_liquidado: db.smae_valor_liquidado,

            mes: db.mes,
            ano: db.ano,
            mes_corrente: db.mes_corrente,

            logs: logs
        }

    }

    async getFiles(myInput: any, pdm_id: number, params: any): Promise<FileOutput[]> {
        const dados = myInput as ListOrcamentoExecutadoDto;
        const dto = params as CreateOrcamentoExecutadoDto;

        const pdm = await this.prisma.pdm.findUniqueOrThrow({ where: { id: pdm_id } });

        const out: FileOutput[] = [];

        let camposAnoMes: any[] = [];
        let camposAno: any[] = [];
        if (dto.tipo == 'Analitico') {
            camposAnoMes = [
                { value: 'mes', label: 'mês' },
                'ano',
                {
                    value: (r: RetornoRealizadoDb) => {
                        return r.mes_corrente ? 'Sim' : 'Não'
                    }, label: 'mês corrente'
                }
            ];
            camposAno[0] = camposAnoMes[0];
        }

        const camposMetaIniAtv = [
            { value: 'meta.codigo', label: 'Código da Meta' },
            { value: 'meta.titulo', label: 'Título da Meta' },
            { value: 'meta.id', label: 'ID da Meta' },
            { value: 'iniciativa.codigo', label: 'Código da ' + pdm.rotulo_iniciativa },
            { value: 'iniciativa.titulo', label: 'Título da ' + pdm.rotulo_iniciativa },
            { value: 'iniciativa.id', label: 'ID da ' + pdm.rotulo_iniciativa },
            { value: 'atividade.codigo', label: 'Código da ' + pdm.rotulo_atividade },
            { value: 'atividade.titulo', label: 'Título da ' + pdm.rotulo_atividade },
            { value: 'atividade.id', label: 'ID da ' + pdm.rotulo_atividade },
        ];

        if (dados.linhas.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
                fields: [
                    ...camposAnoMes,
                    ...camposMetaIniAtv,
                    'dotacao',
                    'processo',
                    'nota_empenho',
                    'orgao.codigo',
                    'orgao.nome',
                    'unidade.codigo',
                    'unidade.nome',
                    'fonte.codigo',
                    'fonte.nome',
                    'plan_dotacao_sincronizado_em',
                    'plan_sof_val_orcado_atualizado',
                    'plan_valor_planejado',
                    'plan_dotacao_ano_utilizado',
                    'plan_dotacao_mes_utilizado',
                    'dotacao_sincronizado_em',
                    'dotacao_valor_empenhado',
                    'dotacao_valor_liquidado',
                    'dotacao_ano_utilizado',
                    'dotacao_mes_utilizado',
                    'smae_valor_empenhado',
                    'smae_valor_liquidado',
                    'logs',
                ]
            });
            const linhas = json2csvParser.parse(dados.linhas.map((r) => { return { ...r, logs: r.logs.join("\r\n") } }));
            out.push({
                name: 'executado.csv',
                buffer: Buffer.from(linhas, "utf8")
            });
        }

        if (dados.linhas_planejado.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
                fields: [
                    ...camposAno,
                    ...camposMetaIniAtv,
                    'dotacao',
                    'orgao.codigo',
                    'orgao.nome',
                    'unidade.codigo',
                    'unidade.nome',
                    'fonte.codigo',
                    'fonte.nome',
                    'plan_dotacao_sincronizado_em',
                    'plan_sof_val_orcado_atualizado',
                    'plan_valor_planejado',
                    'plan_dotacao_ano_utilizado',
                    'plan_dotacao_mes_utilizado',
                    'logs',
                ]
            });
            const linhas = json2csvParser.parse(dados.linhas_planejado.map((r) => { return { ...r, logs: r.logs.join("\r\n") } }));
            out.push({
                name: 'planejado.csv',
                buffer: Buffer.from(linhas, "utf8")
            });
        }

        return [
            {
                name: 'info.json',
                buffer: Buffer.from(JSON.stringify({
                    params: params,
                    "horario": Date2YMD.tzSp2UTC(new Date())
                }), "utf8")
            },
            ...out
        ]
    }

}
