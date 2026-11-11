import { Injectable } from '@nestjs/common';
import { CicloFisico, Pdm, Prisma } from '@prisma/client';
import { Date2YMD, SYSTEM_TIMEZONE } from '../../common/date2ymd';
import { leMonitoramentoFases } from '../../pdm-ciclo/monitoramento-fase.leitura';
import { PrismaService } from '../../prisma/prisma.service';
import { getReportRowSchema } from '../post-process/report-column.decorator';
import { RelPsMonitoramentoMensalFasesCsvRow } from '../ps-monitoramento-mensal/entities/ps-monitoramento-mensal-csv.entity';
import { montaLinhasFasesCsv } from '../ps-monitoramento-mensal/monitoramento-fases-csv';

import { DefaultCsvOptions, DefaultTransforms, FileOutput } from '../utils/utils.service';
import { CreateRelMonitoramentoMensalDto } from './dto/create-monitoramento-mensal.dto';
import {
    RelMfMetas,
    RelSerieVariavelDto,
    RetMonitoramentoFisico,
    RetMonitoramentoMensal,
} from './entities/monitoramento-mensal.entity';
import { CsvWriterOptions, WriteCsvToBuffer, WriteCsvToFile } from 'src/common/helpers/CsvWriter';
import { ReportContext } from '../relatorios/helpers/reports.contexto';

@Injectable()
export class MonitoramentoMensalMfService {
    constructor(private readonly prisma: PrismaService) {}

    async create_mf(dto: CreateRelMonitoramentoMensalDto, metas: number[]): Promise<RetMonitoramentoFisico | null> {
        const cf = await this.prisma.cicloFisico.findFirst({
            where: {
                pdm_id: dto.pdm_id,
                data_ciclo: new Date([dto.ano, dto.mes, '01'].join('-')),
            },
        });
        if (!cf) return null;

        const seriesVariaveis = await this.getSeriesVariaveis(cf, metas);

        const metasDb = await this.prisma.meta.findMany({
            where: { id: { in: metas }, removido_em: null },
            select: { id: true, titulo: true, codigo: true },
        });
        const fasesPorMeta = await leMonitoramentoFases(
            this.prisma,
            cf.pdm_id,
            cf.id,
            metasDb.map((m) => m.id)
        );

        const metasOut: RelMfMetas[] = metasDb.map((meta) => {
            const monitoramento = fasesPorMeta.get(meta.id);
            return {
                meta,
                ciclo_fechado: monitoramento?.ciclo_fechado ?? false,
                ciclo_reaberto: monitoramento?.ciclo_reaberto ?? false,
                fases: monitoramento?.fases ?? [],
            };
        });

        return {
            ano: cf.data_ciclo.getUTCFullYear(),
            mes: cf.data_ciclo.getUTCMonth() + 1,
            ciclo_fisico_id: cf.id,
            metas: metasOut,
            seriesVariaveis: seriesVariaveis,
        };
    }

    async getSeriesVariaveis(cf: CicloFisico, metas: number[]): Promise<RelSerieVariavelDto[]> {
        const serieVariaveis = await this.prisma.$queryRaw`
        with cf as (
            select pdm_id, id, data_ciclo
            from ciclo_fisico
            where id = ${cf.id}
        ), variaveis as (
        select
            vv.id as variavel_id,
            vv.titulo,
            vv.codigo,
            (cf.data_ciclo - (vv.atraso_meses || ' months')::interval)::date as data_valor
        from variavel vv,  cf
        where vv.removido_em is null
        and exists (
            select
                1
            from indicador_variavel iv
            join (
                 -- indicadores do pdm
                select
                    im.id as indicador_id
                from meta m
                join indicador im on im.meta_id = m.id and im.removido_em is null
                where m.pdm_id = (select pdm_id from cf)
                and m.ativo = TRUE
                and m.removido_em is null
                UNION ALL
                select
                    ii.id as indicador_id
                from meta m
                join iniciativa i on i.meta_id = m.id and i.removido_em is null
                 join indicador ii on ii.iniciativa_id = i.id and ii.removido_em is null
                 where m.pdm_id = (select pdm_id from cf)
                 and m.ativo = TRUE
                 and m.removido_em is null
                 UNION ALL
                 select
                     ia.id as indicador_id
                 from meta m
                 join iniciativa i on i.meta_id = m.id and i.removido_em is null
                 join atividade a on a.iniciativa_id = i.id and a.removido_em is null
                 join indicador ia on ia.atividade_id = a.id and ia.removido_em is null
                 where m.pdm_id = (select pdm_id from cf)
                 and m.ativo = TRUE
                 and m.removido_em is null

             ) i on i.indicador_id = iv.indicador_id
             WHERE iv.desativado_em is null
             and vv.id = iv.variavel_id
        ) AND variavel_participa_do_ciclo(vv.id, (cf.data_ciclo - (vv.atraso_meses || ' months')::interval)::date) = TRUE ),
        series as (
            select 'Realizado'::"Serie" as serie
            union all
            select 'RealizadoAcumulado'::"Serie"
        ),
        all_sv as ( select *  from series, variaveis)
        select
            all_sv.serie,
            all_sv.variavel_id,
            all_sv.titulo,
            all_sv.codigo,
            TO_CHAR(all_sv.data_valor, 'YYYY-MM-DD') as data_valor,
            sv.valor_nominal,
            sv.atualizado_em,
            f_id_nome_exibicao(sv.atualizado_por) as atualizado_por,
            coalesce(sv.conferida, svcf.conferida, case when sv.id is not null then false else null end) as conferida,
            TO_CHAR(conferida_em AT TIME ZONE ${SYSTEM_TIMEZONE}, 'YYYY-MM-DD') as conferida_em,
            f_id_nome_exibicao(conferida_por) as conferida_por,
            coalesce(aguarda_cp, false) as aguarda_cp,
            aguarda_complementacao,
            coalesce(ii.meta_id, i.meta_id) as meta_id,
            coalesce(ai.iniciativa_id, i.iniciativa_id) as iniciativa_id,
            i.atividade_id,
            mi.codigo as codigo_meta,
            ii.codigo as codigo_iniciativa,
            ai.codigo as codigo_atividade,
            mi.titulo as titulo_meta,
            ii.titulo as titulo_iniciativa,
            ai.titulo as titulo_atividade,
            vcfq.analise_qualitativa as analise_qualitativa
        from all_sv
        left join serie_variavel sv on sv.variavel_id = all_sv.variavel_id and sv.data_valor = all_sv.data_valor and sv.serie = all_sv.serie
        left join status_variavel_ciclo_fisico svcf on svcf.variavel_id = all_sv.variavel_id and svcf.ciclo_fisico_id = ${cf.id}
        left join variavel_ciclo_fisico_qualitativo vcfq on vcfq.ciclo_fisico_id = ${cf.id} and vcfq.variavel_id = all_sv.variavel_id and vcfq.ultima_revisao and vcfq.removido_em is null
        join indicador_variavel iv on iv.variavel_id = all_sv.variavel_id AND iv.indicador_origem_id is null
        join indicador i on i.id = iv.indicador_id AND i.removido_em is null
        left join atividade ai on ai.id = i.atividade_id
        left join iniciativa ii on  ii.id = coalesce(ai.iniciativa_id, i.iniciativa_id)
        left join meta mi on mi.id = coalesce(ii.meta_id, i.meta_id)
        WHERE mi.id IN (${metas.length ? Prisma.join(metas) : 0})
        order by all_sv.serie, all_sv.codigo
        `;

        return serieVariaveis as RelSerieVariavelDto[];
    }

    async getFiles(myInput: RetMonitoramentoMensal, pdm: Pdm, ctx: ReportContext): Promise<FileOutput[]> {
        const out: FileOutput[] = [];
        if (!myInput.monitoramento_fisico || myInput.monitoramento_fisico.metas.length == 0) return [];

        const { ano, mes } = myInput.monitoramento_fisico;
        const data_ciclo = Date2YMD.toString(new Date(Date.UTC(ano, mes - 1, 1)));
        const fasesRows = montaLinhasFasesCsv(
            myInput.monitoramento_fisico.metas.map((m) => ({
                meta_id: m.meta.id,
                meta_codigo: m.meta.codigo,
                meta_titulo: m.meta.titulo,
                data_ciclo,
                ciclo_fechado: m.ciclo_fechado,
                fases: m.fases,
            }))
        );

        if (fasesRows.length) {
            const opts: CsvWriterOptions<RelPsMonitoramentoMensalFasesCsvRow> = {
                csvOptions: DefaultCsvOptions,
                transforms: DefaultTransforms,
                fields: getReportRowSchema(RelPsMonitoramentoMensalFasesCsvRow).colunas.map((c) => ({
                    value: c.name,
                    label: c.label,
                })),
            };
            out.push({ name: 'monitoramento-fases.csv', buffer: WriteCsvToBuffer(fasesRows, opts) });
        }

        const seriesVariaveis = myInput.monitoramento_fisico.seriesVariaveis;
        if (seriesVariaveis.length) {
            const campos = [
                { value: 'serie', label: 'Série' },
                { value: 'variavel_id', label: 'ID da Variável' },
                { value: 'titulo', label: 'Título' },
                { value: 'atualizado_por.nome_exibicao', label: 'Atualizado Por' },
                { value: 'atualizado_em', label: 'Atualizado em' },
                { value: 'codigo', label: 'Código' },
                { value: 'data_valor', label: 'Data de Valor' },
                { value: 'valor_nominal', label: 'Valor Nominal' },
                { value: 'conferida_por.nome_exibicao', label: 'Conferida Por' },
                { value: 'conferida_em', label: 'Conferida Em' },
                {
                    value: (row: RelSerieVariavelDto) => {
                        return row.conferida ? 'Sim' : 'Não';
                    },
                    label: 'Conferida',
                },
                {
                    value: (row: RelSerieVariavelDto) => {
                        return row.aguarda_cp ? 'Sim' : 'Não';
                    },
                    label: 'Aguarda CP',
                },
                {
                    value: (row: RelSerieVariavelDto) => {
                        return row.aguarda_complementacao ? 'Sim' : 'Não';
                    },
                    label: 'Aguarda Complementação',
                },
                { value: 'meta_id', label: 'ID da meta' },
                { value: 'iniciativa_id', label: 'ID da ' + pdm.rotulo_iniciativa },
                { value: 'atividade_id', label: 'ID da ' + pdm.rotulo_atividade },
                { value: 'codigo_meta', label: 'codigo_meta' },
                { value: 'codigo_iniciativa_codigo', label: 'Código da ' + pdm.rotulo_iniciativa },
                { value: 'codigo_atividade_codigo', label: 'Código da ' + pdm.rotulo_atividade },
                { value: 'titulo_meta', label: 'Título da Meta' },
                { value: 'titulo_iniciativa', label: 'Título da ' + pdm.rotulo_iniciativa },
                { value: 'titulo_atividade', label: 'Título da ' + pdm.rotulo_atividade },
                { value: 'analise_qualitativa', label: 'Analise Qualitativa' },
            ];
            const tmp = ctx.getTmpFile('serie-variavel');
            const opts: CsvWriterOptions<RelSerieVariavelDto> = {
                csvOptions: DefaultCsvOptions,
                transforms: DefaultTransforms,
                fields: campos,
            };

            await WriteCsvToFile(seriesVariaveis, tmp.stream, opts);
            out.push({
                name: 'serie-variaveis.csv',
                localFile: tmp.path,
            });
        } else {
            out.push({
                name: 'serie-variaveis.txt',
                buffer: Buffer.from('Não há variáveis no ciclo, serie-variaveis.csv não foi gerado.', 'utf8'),
            });
        }

        return out;
    }
}
