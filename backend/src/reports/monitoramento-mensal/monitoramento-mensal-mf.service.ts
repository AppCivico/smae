import { Injectable } from '@nestjs/common';
import { CicloFisico, Pdm, Prisma } from '@prisma/client';
import { SYSTEM_TIMEZONE } from '../../common/date2ymd';
import { MetasAnaliseQualiService } from '../../mf/metas/metas-analise-quali.service';
import { MetasFechamentoService } from '../../mf/metas/metas-fechamento.service';
import { MetasRiscoService } from '../../mf/metas/metas-risco.service';
import { PrismaService } from '../../prisma/prisma.service';

import { DefaultCsvOptions, FileOutput } from '../utils/utils.service';
import { CreateRelMonitoramentoMensalDto } from './dto/create-monitoramento-mensal.dto';
import {
    RelMfMetas,
    RelSerieVariavelDto,
    RetMonitoramentoFisico,
    RetMonitoramentoMensal,
} from './entities/monitoramento-mensal.entity';

const {
    Parser,
    transforms: { flatten },
} = require('json2csv');
const defaultTransform = [flatten({ paths: [] })];

class QualiCsv {
    informacoes_complementares: string;
    referencia_data: string;
    criado_em: string;
    criador_nome_exibicao: string;
    meta_id: string;
    meta_titulo: string;
    meta_codigo: string;
    id: string;
}

class RiscoCsv {
    detalhamento: string;
    ponto_de_atencao: string;
    referencia_data: string;
    criado_em: string;
    criador_nome_exibicao: string;
    meta_id: string;
    meta_titulo: string;
    meta_codigo: string;
    id: string;
}

class FechamentoCsv {
    comentario: string;
    referencia_data: string;
    criado_em: string;
    criador_nome_exibicao: string;
    meta_id: string;
    meta_titulo: string;
    meta_codigo: string;
    id: string;
}

@Injectable()
export class MonitoramentoMensalMfService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly analiseQuali: MetasAnaliseQualiService,
        private readonly analiseRisco: MetasRiscoService,
        private readonly fechamento: MetasFechamentoService
    ) {}

    async create_mf(dto: CreateRelMonitoramentoMensalDto, metas: number[]): Promise<RetMonitoramentoFisico | null> {
        const cf = await this.prisma.cicloFisico.findFirst({
            where: {
                pdm_id: dto.pdm_id,
                data_ciclo: new Date([dto.ano, dto.mes, '01'].join('-')),
            },
        });
        if (!cf) return null;

        const seriesVariaveis = await this.getSeriesVariaveis(cf, metas);

        const metasOut: RelMfMetas[] = [];

        const metasDb = await this.prisma.meta.findMany({
            where: { id: { in: metas }, removido_em: null },
            select: { id: true, titulo: true, codigo: true },
        });

        for (const meta of metasDb) {
            const ret: RelMfMetas = {
                meta,
                analiseQuali: null,
                fechamento: null,
                analiseRisco: null,
            };
            const params = { ciclo_fisico_id: cf.id, meta_id: meta.id, apenas_ultima_revisao: true };

            // fazendo dessa forma o prisma pode fazer as queries em parelelo
            const results = await Promise.all([
                this.analiseQuali.getMetaAnaliseQualitativa(params, null, null),
                this.analiseRisco.getMetaRisco(params, null, null),
                this.fechamento.getMetaFechamento(params, null, null),
            ]);

            if (results[0].analises.length) ret.analiseQuali = results[0].analises[0];

            if (results[1].riscos.length) ret.analiseRisco = results[1].riscos[0];

            if (results[2].fechamentos) ret.fechamento = results[2].fechamentos[0];

            metasOut.push(ret);
        }

        return {
            ano: cf.data_ciclo.getFullYear(),
            mes: cf.data_ciclo.getMonth(),
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
        where exists (
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
        join indicador_variavel iv on iv.variavel_id = sv.variavel_id AND iv.indicador_origem_id is null
        join indicador i on i.id = iv.indicador_id AND i.removido_em is null
        left join atividade ai on ai.id = i.atividade_id
        left join iniciativa ii on  ii.id = coalesce(ai.iniciativa_id, i.iniciativa_id)
        left join meta mi on mi.id = coalesce(ii.meta_id, i.meta_id)
        WHERE mi.id IN (${metas.length ? Prisma.join(metas) : 0})
        order by all_sv.serie, all_sv.codigo
        `;

        return serieVariaveis as RelSerieVariavelDto[];
    }

    async getFiles(myInput: RetMonitoramentoMensal, pdm: Pdm): Promise<FileOutput[]> {
        const out: FileOutput[] = [];
        if (!myInput.monitoramento_fisico || myInput.monitoramento_fisico.metas.length == 0) return [];

        const qualiRows: QualiCsv[] = [];
        const riscoRows: RiscoCsv[] = [];
        const fechamentoRows: FechamentoCsv[] = [];
        for (const meta of myInput.monitoramento_fisico.metas) {
            if (meta.analiseQuali) {
                qualiRows.push({
                    id: meta.analiseQuali.id.toString(),
                    criador_nome_exibicao: meta.analiseQuali.criador.nome_exibicao,
                    criado_em: meta.analiseQuali.criado_em.toString(),
                    informacoes_complementares: meta.analiseQuali.informacoes_complementares,
                    meta_codigo: meta.meta.codigo,
                    meta_titulo: meta.meta.titulo,
                    meta_id: meta.meta.id.toString(),
                    referencia_data: meta.analiseQuali.referencia_data.toString(),
                });
            }

            if (meta.analiseRisco) {
                riscoRows.push({
                    id: meta.analiseRisco.id.toString(),
                    criador_nome_exibicao: meta.analiseRisco.criador.nome_exibicao,
                    criado_em: meta.analiseRisco.criado_em.toString(),
                    ponto_de_atencao: meta.analiseRisco.ponto_de_atencao,
                    detalhamento: meta.analiseRisco.detalhamento,
                    meta_codigo: meta.meta.codigo,
                    meta_titulo: meta.meta.titulo,
                    meta_id: meta.meta.id.toString(),
                    referencia_data: meta.analiseRisco.referencia_data.toString(),
                });
            }

            if (meta.fechamento) {
                fechamentoRows.push({
                    id: meta.fechamento.id.toString(),
                    criador_nome_exibicao: meta.fechamento.criador.nome_exibicao,
                    criado_em: meta.fechamento.criado_em.toString(),
                    comentario: meta.fechamento.comentario,
                    meta_codigo: meta.meta.codigo,
                    meta_titulo: meta.meta.titulo,
                    meta_id: meta.meta.id.toString(),
                    referencia_data: meta.fechamento.referencia_data.toString(),
                });
            }
        }

        if (qualiRows.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
                fields: undefined,
            });

            const linhas = json2csvParser.parse(qualiRows);
            out.push({
                name: 'analises-qualitativas.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }

        if (fechamentoRows.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
                fields: undefined,
            });

            const linhas = json2csvParser.parse(fechamentoRows);
            out.push({
                name: 'fechamentos.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }

        if (riscoRows.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
                fields: undefined,
            });

            const linhas = json2csvParser.parse(riscoRows);
            out.push({
                name: 'analises-de-risco.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
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

            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
                fields: campos,
            });

            const linhas = json2csvParser.parse(seriesVariaveis);
            out.push({
                name: 'serie-variaveis.csv',
                buffer: Buffer.from(linhas, 'utf8'),
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
