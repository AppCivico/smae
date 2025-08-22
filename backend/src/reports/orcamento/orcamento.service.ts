import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { Date2YMD } from '../../common/date2ymd';
import { DotacaoService } from '../../dotacao/dotacao.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PrevisaoCustoService } from '../previsao-custo/previsao-custo.service';
import { ReportContext } from '../relatorios/helpers/reports.contexto';
import {
    DefaultCsvOptions,
    DefaultTransforms as DefaultTransforms,
    FileOutput,
    ReportableService,
    UtilsService,
} from '../utils/utils.service';
import { SuperCreateOrcamentoExecutadoDto } from './dto/create-orcamento-executado.dto';
import {
    ListOrcamentoExecutadoDto,
    OrcamentoExecutadoSaidaDto,
    OrcamentoPlanejadoSaidaDto,
} from './entities/orcamento-executado.entity';
import { CsvWriterOptions, WriteCsvToFile } from 'src/common/helpers/CsvWriter';

class RetornoRealizadoDb {
    plan_dotacao_ano_utilizado: string | null;
    plan_dotacao_mes_utilizado: string | null;
    plan_sof_val_orcado_atualizado: string | null;
    plan_valor_planejado: string | null;
    plan_dotacao_sincronizado_em: Date | null;
    dotacao: string;
    dotacao_complemento: string | null;
    processo: string | null;
    nota_empenho: string | null;
    dotacao_valor_empenhado: string;
    dotacao_valor_liquidado: string;
    dotacao_mes_utilizado: string | null;
    dotacao_ano_utilizado: string | null;
    dotacao_sincronizado_em: string;
    meta_id: string;
    meta_codigo: string;
    meta_titulo: string;
    iniciativa_id: string;
    iniciativa_codigo: string;
    iniciativa_titulo: string;
    atividade_id: string;
    atividade_codigo: string;
    atividade_titulo: string;
    projeto_id: string | null;
    projeto_codigo: string | null;
    projeto_nome: string | null;
    ano: string;
    mes: string;
    mes_corrente: boolean;
    smae_valor_empenhado: string;
    smae_valor_liquidado: string;
    smae_percentual_empenho: string | null;
    smae_percentual_liquidado: string | null;
    total_registros?: number;
    orcamento_realizado_item_id?: number;
}

class RetornoPlanejadoDb {
    plan_dotacao_ano_utilizado: string | null;
    plan_dotacao_mes_utilizado: string | null;
    plan_sof_val_orcado_atualizado: string;
    plan_valor_planejado: string;
    plan_dotacao_sincronizado_em: Date | null;
    dotacao: string;
    meta_id: string;
    meta_codigo: string;
    meta_titulo: string;

    iniciativa_id: string;
    iniciativa_codigo: string;
    iniciativa_titulo: string;

    atividade_id: string;
    atividade_codigo: string;
    atividade_titulo: string;

    projeto_id: string | null;
    projeto_codigo: string | null;
    projeto_nome: string | null;

    ano: string;

    total_registros?: number;
    orcamento_planejado_id?: number;
}

@Injectable()
export class OrcamentoService implements ReportableService {
    private readonly logger = new Logger(OrcamentoService.name);
    constructor(
        @Inject(forwardRef(() => UtilsService))
        private readonly utils: UtilsService,
        private readonly prisma: PrismaService,
        private readonly dotacaoService: DotacaoService,
        private readonly prevCustoService: PrevisaoCustoService
    ) {}

    async asJSON(
        dto: SuperCreateOrcamentoExecutadoDto,
        user: PessoaFromJwt | null
    ): Promise<ListOrcamentoExecutadoDto> {
        const { orcExec, anoIni, anoFim, orcPlan } = await this.buscaIds(dto, user);

        const retExecutado: OrcamentoExecutadoSaidaDto[] = [];
        const retPlanejado: OrcamentoPlanejadoSaidaDto[] = [];

        if (dto.tipo == 'Analitico' && orcExec.length > 0) {
            const resultadosRealizado: RetornoRealizadoDb[] = await this.queryAnaliticoExecutado(orcExec);
            for (const r of resultadosRealizado) {
                retExecutado.push(this.convertRealizadoRow(r));
            }

            const resultadosPlanejados = await this.queryAnaliticoPlanejado(anoIni, anoFim, orcPlan);
            for (const r of resultadosPlanejados) {
                retPlanejado.push(this.convertPlanejadoRow(r));
            }
        } else if (dto.tipo == 'Consolidado' && orcExec.length > 0) {
            const resultados: RetornoRealizadoDb[] = await this.queryConsolidadoExecutado(orcExec);

            for (const r of resultados) {
                retExecutado.push(this.convertRealizadoRow(r));
            }

            const resultadosPlanejados = await this.queryConsolidadoPlanejado(anoIni, anoFim, orcPlan);
            for (const r of resultadosPlanejados) {
                retPlanejado.push(this.convertPlanejadoRow(r));
            }
        }

        await this.dotacaoService.setManyOrgaoUnidadeFonte(retExecutado);
        await this.dotacaoService.setManyOrgaoUnidadeFonte(retPlanejado);

        return {
            linhas: retExecutado,
            linhas_planejado: retPlanejado,
        };
    }

    private async buscaIds(dto: SuperCreateOrcamentoExecutadoDto, user: PessoaFromJwt | null) {
        const anoIni = Date2YMD.toString(dto.inicio).substring(0, 4);
        const anoFim = Date2YMD.toString(dto.fim).substring(0, 4);

        let filtroMetas: number[] | undefined = undefined;

        if (!dto.projeto_id) dto.projeto_id = undefined;
        if (!dto.portfolio_id) dto.portfolio_id = undefined;

        // sem portfolio_id e sem projeto_id = filtra por meta
        if (dto.portfolio_id === undefined && dto.projeto_id === undefined) {
            const { metas } = await this.utils.applyFilter(dto, { iniciativas: false, atividades: false }, user);
            filtroMetas = metas.map((r) => r.id);
        }

        const orgaoMatch: any[] = [];
        if (Array.isArray(dto.orgaos) && dto.orgaos.length > 0)
            for (const orgao of dto.orgaos) {
                orgaoMatch.push({
                    dotacao: {
                        startsWith: orgao + '.',
                    },
                });
            }

        const orcExec = await this.prisma.orcamentoRealizadoItem.findMany({
            where: {
                sobrescrito_em: null,
                OrcamentoRealizado: {
                    meta_id: filtroMetas ? { in: filtroMetas } : undefined,
                    projeto_id: dto.projeto_id ? dto.projeto_id : undefined,
                    ...(dto.portfolio_id
                        ? {
                              projeto_id: { 'not': null },
                              OR: [
                                  { projeto: { portfolio_id: dto.portfolio_id } },
                                  {
                                      projeto: {
                                          portfolios_compartilhados: {
                                              some: { portfolio_id: dto.portfolio_id, removido_em: null },
                                          },
                                      },
                                  },
                              ],
                          }
                        : {}),
                    removido_em: null,
                    OR: orgaoMatch.length === 0 ? undefined : orgaoMatch,
                },
                data_referencia: {
                    gte: Date2YMD.tzSp2UTC(dto.inicio),
                    lte: Date2YMD.tzSp2UTC(dto.fim),
                },
            },
            select: { id: true },
        });

        const baseWhere: any = {
            removido_em: null,
            ano_referencia: {
                gte: dto.inicio.getFullYear(),
                lte: dto.fim.getFullYear(),
            },
        };

        // 1) Aplica projeto/portfólio e órgão ANTES do fallback de metas
        if (dto.projeto_id) {
            baseWhere.projeto_id = dto.projeto_id;
        }
        if (dto.portfolio_id) {
            // restringe a itens vinculados a algum projeto e pertencentes ao portfólio (direto ou compartilhado)
            baseWhere.projeto_id = { not: null };
            baseWhere.AND = [
                ...(baseWhere.AND ?? []),
                {
                    OR: [
                        { projeto: { portfolio_id: dto.portfolio_id } },
                        {
                            projeto: {
                                portfolios_compartilhados: {
                                    some: { portfolio_id: dto.portfolio_id, removido_em: null },
                                },
                            },
                        },
                    ],
                },
            ];
        }
        baseWhere.OR = orgaoMatch.length === 0 ? undefined : orgaoMatch;

        // 2) Só aplica filtro de metas se houver correspondência com os filtros acima
        if (Array.isArray(filtroMetas) && filtroMetas.length) {
            const metasExistem = await this.prisma.orcamentoPlanejado.count({
                where: { ...baseWhere, meta_id: { in: filtroMetas } },
            });
            if (metasExistem > 0) {
                baseWhere.meta_id = { in: filtroMetas };
            } else {
                this.logger.warn(
                    `[orcamento_planejado] filtroMetas sem correspondência (count=${filtroMetas.length}); ignorando para garantir saída do planejado.csv`
                );
            }
        }

        baseWhere.OR = orgaoMatch.length === 0 ? undefined : orgaoMatch;

        const orcPlan = await this.prisma.orcamentoPlanejado.findMany({
            where: baseWhere,
            select: { id: true },
        });

        return { orcExec, anoIni, anoFim, orcPlan };
    }

    private async queryConsolidadoPlanejado(
        ano_ini: string,
        ano_fim: string,
        search: { id: number }[]
    ): Promise<RetornoPlanejadoDb[]> {
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
                    ma.titulo as atividade_titulo,

                    p.id as projeto_id,
                    p.codigo as projeto_codigo,
                    p.nome as projeto_nome

                from orcamento_planejado op
                left join meta m on m.id = op.meta_id and m.removido_em IS NULL
                left join iniciativa mi on mi.id = op.iniciativa_id and mi.removido_em IS NULL
                left join atividade ma on ma.id = op.atividade_id and ma.removido_em IS NULL
                left join projeto p on p.id = op.projeto_id and p.removido_em IS NULL

                where op.ano_referencia >= ${ano_ini}::int
                and op.ano_referencia <= ${ano_fim}::int
                and op.id = ANY(${search.map((r) => r.id)}::int[])
                and op.removido_em IS NULL
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

                previsoes.projeto_id,
                previsoes.projeto_nome,
                previsoes.projeto_nome,

                to_char_numeric((previsoes.plan_valor_planejado)::numeric) as plan_valor_planejado,
                count(1) as total_registros
            from previsoes
            left join dotacao_planejado dp ON previsoes.dotacao = dp.dotacao AND previsoes.ano = dp.ano_referencia

            GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19
            order by previsoes.dotacao, 1, 2
            `;
    }

    private async queryAnaliticoPlanejado(
        ano_ini: string,
        ano_fim: string,
        search: { id: number }[]
    ): Promise<RetornoPlanejadoDb[]> {
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

                    op.id as orcamento_planejado_id,

                    p.id as projeto_id,
                    p.codigo as projeto_codigo,
                    p.nome as projeto_nome

                from orcamento_planejado op
                left join meta m on m.id = op.meta_id and m.removido_em IS NULL
                left join iniciativa mi on mi.id = op.iniciativa_id and mi.removido_em IS NULL
                left join atividade ma on ma.id = op.atividade_id and ma.removido_em IS NULL
                left join projeto p on p.id = op.projeto_id and p.removido_em IS NULL

                where op.ano_referencia >= ${ano_ini}::int
                and op.ano_referencia <= ${ano_fim}::int
                and op.removido_em IS NULL
                and op.id = ANY(${search.map((r) => r.id)}::int[])
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

    private async queryConsolidadoExecutado(search: { id: number }[]): Promise<RetornoRealizadoDb[]> {
        return await this.prisma.$queryRaw`
            with custos as (
                select
                    o.dotacao,
                    o.dotacao_complemento,
                    o.processo,
                    o.nota_empenho,
                    i.valor_empenho as smae_valor_empenhado,
                    i.valor_liquidado as smae_valor_liquidado,
                    i.percentual_empenho as smae_percentual_empenho,
                    i.percentual_liquidado as smae_percentual_liquidado,
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

                    p.id as projeto_id,
                    p.codigo as projeto_codigo,
                    p.nome as projeto_nome

                from orcamento_realizado_item i
                join orcamento_realizado o on o.id = i.orcamento_realizado_id
                left join meta m on m.id = o.meta_id and m.removido_em IS NULL
                left join iniciativa mi on mi.id = o.iniciativa_id and mi.removido_em IS NULL
                left join atividade ma on ma.id = o.atividade_id and ma.removido_em IS NULL
                left join projeto p on p.id = o.projeto_id and p.removido_em IS NULL

                where i.id = ANY(${search.map((r) => r.id)}::int[])
                and i.mes_corrente = TRUE
                and i.sobrescrito_em IS NULL
                and o.removido_em IS NULL
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
                AND op.removido_em is null
                AND op.meta_id = custos.meta_id
                AND coalesce(op.iniciativa_id, -1) = coalesce(custos.iniciativa_id, -1)
                AND coalesce(op.atividade_id, -1) = coalesce(custos.atividade_id, -1)
            left join dotacao_planejado dp ON custos.processo IS NULL
                AND ( custos.dotacao = dp.dotacao AND custos.ano = dp.ano_referencia)

                left join dotacao_realizado dr ON custos.processo IS NULL
                AND ( custos.dotacao = dr.dotacao AND custos.ano = dr.ano_referencia)

                left join dotacao_processo drp ON custos.processo IS NOT NULL AND custos.nota_empenho IS NULL
                AND ( custos.dotacao = drp.dotacao AND custos.ano = drp.ano_referencia AND custos.processo = drp.dotacao_processo)

                left join dotacao_processo_nota dn ON custos.nota_empenho IS NOT NULL
                AND ( custos.dotacao = dn.dotacao AND cast(split_part(custos.nota_empenho, '/', 2) as bigint) = dn.ano_referencia AND custos.processo = dn.dotacao_processo  AND custos.nota_empenho = dn.dotacao_processo_nota)
            )
            select
                plan_dotacao_ano_utilizado,
                plan_dotacao_mes_utilizado,
                plan_sof_val_orcado_atualizado,
                plan_valor_planejado,
                plan_dotacao_sincronizado_em,
                dotacao,
                dotacao_complemento,
                processo,
                nota_empenho,
                dotacao_valor_empenhado,
                dotacao_valor_liquidado,
                smae_percentual_empenho,
                smae_percentual_liquidado,
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
                projeto_id,
                projeto_codigo,
                projeto_nome,
                '' as ano,
                '' as mes,
                to_char_numeric(sum(smae_valor_empenhado)::numeric) as smae_valor_empenhado,
                to_char_numeric(sum(smae_valor_liquidado)::numeric) as smae_valor_liquidado,
                count(1) as total_registros
            FROM analitico
            GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30
            order by analitico.dotacao, analitico.processo, analitico.nota_empenho, 1, 2
            `;
    }

    private async queryAnaliticoExecutado(search: { id: number }[]): Promise<RetornoRealizadoDb[]> {
        return await this.prisma.$queryRaw`
            with custos as (
                select
                    o.dotacao,
                    o.dotacao_complemento,
                    o.processo,
                    o.nota_empenho,
                    to_char_numeric(i.valor_empenho::numeric) as smae_valor_empenhado,
                    to_char_numeric(i.valor_liquidado::numeric) as smae_valor_liquidado,
                    to_char_numeric(i.percentual_empenho::numeric) as smae_percentual_empenho,
                    to_char_numeric(i.percentual_liquidado::numeric) as smae_percentual_liquidado,
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
                    i.mes_corrente,

                    p.id as projeto_id,
                    p.codigo as projeto_codigo,
                    p.nome as projeto_nome

                from orcamento_realizado_item i
                join orcamento_realizado o on o.id = i.orcamento_realizado_id
                left join meta m on m.id = o.meta_id and m.removido_em IS NULL
                left join iniciativa mi on mi.id = o.iniciativa_id and mi.removido_em IS NULL
                left join atividade ma on ma.id = o.atividade_id and ma.removido_em IS NULL
                left join projeto p on p.id = o.projeto_id and p.removido_em IS NULL

                where i.id = ANY(${search.map((r) => r.id)}::int[])
                and i.mes_corrente = true
                and i.sobrescrito_em IS NULL
                and o.removido_em IS NULL
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
                AND op.removido_em IS NULL
                AND op.meta_id = custos.meta_id
                AND coalesce(op.iniciativa_id, -1) = coalesce(custos.iniciativa_id, -1)
                AND coalesce(op.atividade_id, -1) = coalesce(custos.atividade_id, -1)
            left join dotacao_planejado dp ON custos.processo IS NULL
                AND ( custos.dotacao = dp.dotacao AND custos.ano = dp.ano_referencia)

                left join dotacao_realizado dr ON custos.processo IS NULL
                AND ( custos.dotacao = dr.dotacao AND custos.ano = dr.ano_referencia)

                left join dotacao_processo drp ON custos.processo IS NOT NULL AND custos.nota_empenho IS NULL
                AND ( custos.dotacao = drp.dotacao AND custos.ano = drp.ano_referencia AND custos.processo = drp.dotacao_processo)

                left join dotacao_processo_nota dn ON custos.nota_empenho IS NOT NULL
                AND ( custos.dotacao = dn.dotacao AND cast(split_part(custos.nota_empenho, '/', 2) as bigint) = dn.ano_referencia AND custos.processo = dn.dotacao_processo  AND custos.nota_empenho = dn.dotacao_processo_nota)
                order by custos.dotacao, custos.processo, custos.nota_empenho, 1, 2
            `;
    }

    private convertPlanejadoRow(db: RetornoPlanejadoDb): OrcamentoPlanejadoSaidaDto {
        const logs: string[] = [];

        if ('total_registros' in db && db.total_registros) {
            logs.push(`Total de Itens Consolidados ${db.total_registros}`);
        }
        if ('orcamento_planejado_id' in db && db.orcamento_planejado_id) {
            logs.push(`orcamento_planejado_id = ${db.orcamento_planejado_id}`);
        }

        return {
            meta: { codigo: db.meta_codigo, titulo: db.meta_titulo, id: +db.meta_id },
            iniciativa: db.iniciativa_id
                ? { codigo: db.iniciativa_codigo, titulo: db.iniciativa_titulo, id: +db.iniciativa_id }
                : null,
            atividade: db.atividade_id
                ? { codigo: db.atividade_codigo, titulo: db.atividade_titulo, id: +db.atividade_id }
                : null,
            projeto: db.projeto_id ? { codigo: db.projeto_codigo, nome: db.projeto_nome!, id: +db.projeto_id } : null,

            acao_orcamentaria: this.dotacaoService.getAcaoOrcamentaria(db.dotacao),
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

            logs: logs,
        };
    }

    private convertRealizadoRow(db: RetornoRealizadoDb): OrcamentoExecutadoSaidaDto {
        const logs: string[] = [];

        if ('total_registros' in db && db.total_registros) {
            logs.push(`Total de Itens Consolidados ${db.total_registros}`);
        }

        if ('orcamento_realizado_item_id' in db && db.orcamento_realizado_item_id) {
            logs.push(`orcamento_realizado_item_id = ${db.orcamento_realizado_item_id}`);
        }

        return {
            meta: { codigo: db.meta_codigo, titulo: db.meta_titulo, id: +db.meta_id },
            iniciativa: db.iniciativa_id
                ? { codigo: db.iniciativa_codigo, titulo: db.iniciativa_titulo, id: +db.iniciativa_id }
                : null,
            atividade: db.atividade_id
                ? { codigo: db.atividade_codigo, titulo: db.atividade_titulo, id: +db.atividade_id }
                : null,
            projeto: db.projeto_id ? { codigo: db.projeto_codigo, nome: db.projeto_nome!, id: +db.projeto_id } : null,

            acao_orcamentaria: this.dotacaoService.getAcaoOrcamentaria(db.dotacao),
            dotacao: `${db.dotacao}${db.dotacao_complemento ? '.' + db.dotacao_complemento : ''}`,
            processo: db.processo,
            nota_empenho: db.nota_empenho,

            orgao: { codigo: '', nome: '' },
            unidade: { codigo: '', nome: '' },
            fonte: { codigo: '', nome: '' },

            plan_dotacao_sincronizado_em: db.plan_dotacao_sincronizado_em
                ? db.plan_dotacao_sincronizado_em.toISOString()
                : null,
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
            smae_percentual_empenho: db.smae_percentual_empenho,
            smae_percentual_liquidado: db.smae_percentual_liquidado,

            mes: db.mes,
            ano: db.ano,
            mes_corrente: db.mes_corrente,

            logs: logs,
        };
    }

    async toFileOutput(
        params: SuperCreateOrcamentoExecutadoDto,
        ctx: ReportContext,
        user: PessoaFromJwt | null
    ): Promise<FileOutput[]> {
        const { orcExec, anoIni, anoFim, orcPlan } = await this.buscaIds(params, user);
        const pdm = params.pdm_id ? await this.prisma.pdm.findUnique({ where: { id: params.pdm_id } }) : undefined;
        await ctx.progress(1);

        const retExecutado: OrcamentoExecutadoSaidaDto[] = [];
        if (params.tipo == 'Analitico') {
            if (orcExec.length > 0) {
                const resultadosRealizado: RetornoRealizadoDb[] = await this.queryAnaliticoExecutado(orcExec);
                for (const r of resultadosRealizado) {
                    retExecutado.push(this.convertRealizadoRow(r));
                }
            }
            await ctx.resumoSaida('Orçamento Executado', retExecutado.length);
        } else if (params.tipo == 'Consolidado') {
            if (orcExec.length > 0) {
                const resultados: RetornoRealizadoDb[] = await this.queryConsolidadoExecutado(orcExec);

                for (const r of resultados) {
                    retExecutado.push(this.convertRealizadoRow(r));
                }
            }
            await ctx.resumoSaida('Orçamento Executado', retExecutado.length);
        }

        await ctx.progress(30);

        const out: FileOutput[] = [];

        let camposAnoMes: any[] = [];
        const camposAno: any[] = [];
        if (params.tipo == 'Analitico') {
            camposAnoMes = [
                { value: 'mes', label: 'mês' },
                'ano',
                {
                    value: (r: RetornoRealizadoDb) => {
                        return r.mes_corrente ? 'Sim' : 'Não';
                    },
                    label: 'mês corrente',
                },
            ];
            camposAno[0] = camposAnoMes[0];
        }

        // TODO: talvez para obras seja necessário verificar o tipo do portfolio
        const camposProjeto = [
            { value: 'projeto.codigo', label: 'Código Projeto' },
            { value: 'projeto.nome', label: 'Nome do Projeto' },
            { value: 'projeto.id', label: 'ID do Projeto' },
        ];

        const campos = pdm
            ? [
                  { value: 'meta.codigo', label: 'Código da Meta' },
                  { value: 'meta.titulo', label: 'Título da Meta' },
                  { value: 'meta.id', label: 'ID da Meta' },
                  { value: 'iniciativa.codigo', label: 'Código da ' + pdm.rotulo_iniciativa },
                  { value: 'iniciativa.titulo', label: 'Título da ' + pdm.rotulo_iniciativa },
                  { value: 'iniciativa.id', label: 'ID da ' + pdm.rotulo_iniciativa },
                  { value: 'atividade.codigo', label: 'Código da ' + pdm.rotulo_atividade },
                  { value: 'atividade.titulo', label: 'Título da ' + pdm.rotulo_atividade },
                  { value: 'atividade.id', label: 'ID da ' + pdm.rotulo_atividade },
              ]
            : camposProjeto;

        if (retExecutado.length) {
            await this.dotacaoService.setManyOrgaoUnidadeFonte(retExecutado);

            const reportTmpExec = ctx.getTmpFile('executado.csv');

            const execCsvOptions: CsvWriterOptions<OrcamentoExecutadoSaidaDto> = {
                csvOptions: DefaultCsvOptions,
                transforms: DefaultTransforms,
                fields: [
                    ...camposAnoMes,
                    ...campos,
                    'dotacao',
                    'processo',
                    'nota_empenho',
                    'orgao.codigo',
                    'orgao.nome',
                    'unidade.codigo',
                    'unidade.nome',
                    'fonte.codigo',
                    'fonte.nome',
                    'acao_orcamentaria',
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
                    'smae_percentual_empenhado',
                    'smae_percentual_liquidado',
                    'logs',
                ],
            };

            // escreve por streaming e usa o header uma única vez
            await WriteCsvToFile(
                retExecutado.map((r) => ({ ...r, logs: r.logs.join('\r\n') })),
                reportTmpExec.stream,
                execCsvOptions
            );

            out.push({
                name: 'executado.csv',
                localFile: reportTmpExec.path,
            });
        }
        await ctx.progress(50);

        const retPlanejado: OrcamentoPlanejadoSaidaDto[] = [];
        if (params.tipo == 'Analitico') {
            if (orcExec.length > 0) {
                const resultadosPlanejados = await this.queryAnaliticoPlanejado(anoIni, anoFim, orcPlan);
                for (const r of resultadosPlanejados) {
                    retPlanejado.push(this.convertPlanejadoRow(r));
                }
            }
            await ctx.resumoSaida('Orçamento Planejado', retPlanejado.length);
        } else if (params.tipo == 'Consolidado') {
            if (orcExec.length > 0) {
                const resultadosPlanejados = await this.queryConsolidadoPlanejado(anoIni, anoFim, orcPlan);
                for (const r of resultadosPlanejados) {
                    retPlanejado.push(this.convertPlanejadoRow(r));
                }
            }
            await ctx.resumoSaida('Orçamento Planejado', retPlanejado.length);
        }

        await ctx.progress(70);
        if (retPlanejado.length) {
            await this.dotacaoService.setManyOrgaoUnidadeFonte(retPlanejado);
            const reportTmpPlan = ctx.getTmpFile('planejado.csv');

            const planCsvOptions: CsvWriterOptions<OrcamentoPlanejadoSaidaDto> = {
                csvOptions: DefaultCsvOptions,
                transforms: DefaultTransforms,
                fields: [
                    ...camposAno,
                    ...campos,
                    'dotacao',
                    'orgao.codigo',
                    'orgao.nome',
                    'unidade.codigo',
                    'unidade.nome',
                    'fonte.codigo',
                    'fonte.nome',
                    'acao_orcamentaria',
                    'plan_dotacao_sincronizado_em',
                    'plan_sof_val_orcado_atualizado',
                    'plan_valor_planejado',
                    'plan_dotacao_ano_utilizado',
                    'plan_dotacao_mes_utilizado',
                    'logs',
                ],
            };

            await WriteCsvToFile(
                retPlanejado.map((r) => ({ ...r, logs: r.logs.join('\r\n') })),
                reportTmpPlan.stream,
                planCsvOptions
            );

            out.push({
                name: 'planejado.csv',
                localFile: reportTmpPlan.path,
            });
        }
        await ctx.progress(99);

        return [
            {
                name: 'info.json',
                buffer: Buffer.from(
                    JSON.stringify({
                        params: params,
                        horario: Date2YMD.tzSp2UTC(new Date()),
                    }),
                    'utf8'
                ),
            },
            ...out,
        ];
    }
}
