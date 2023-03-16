import { Injectable } from '@nestjs/common';
import { CicloFisico, Pdm } from '@prisma/client';
import { plainToClass } from 'class-transformer';
import { MetasAnaliseQualiService } from '../../mf/metas/metas-analise-quali.service';
import { MetasFechamentoService } from '../../mf/metas/metas-fechamento.service';
import { MetasRiscoService } from '../../mf/metas/metas-risco.service';
import { PrismaService } from '../../prisma/prisma.service';

import { DefaultCsvOptions, FileOutput } from '../utils/utils.service';
import { CreateRelMonitoramentoMensalDto } from './dto/create-monitoramento-mensal.dto';
import { RelMfMetas, RetMonitoramentoFisico, RetMonitoramentoMensal, RelSerieVariavelDto } from './entities/monitoramento-mensal.entity';

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
        private readonly fechamento: MetasFechamentoService,
    ) { }

    async create_mf(dto: CreateRelMonitoramentoMensalDto, metas: number[]): Promise<RetMonitoramentoFisico | null> {
        const cf = await this.prisma.cicloFisico.findFirst({
            where: {
                pdm_id: dto.pdm_id,
                data_ciclo: new Date([dto.ano, dto.mes, '01'].join('-')),
            },
        });
        if (!cf) return null;

        const seriesVariaveis = await this.getSeriesVariaveis(cf);

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
            seriesVariaveis: seriesVariaveis
        };
    }

    async getSeriesVariaveis(cf: CicloFisico): Promise<RelSerieVariavelDto[]> {
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
            all_sv.data_valor,
            sv.valor_nominal,
            sv.atualizado_em,
            f_id_nome_exibicao(sv.atualizado_por) as atualizado_por,
            coalesce(sv.conferida, svcf.conferida, case when sv.id is not null then false else null end) as conferida,
            conferida_em,
            f_id_nome_exibicao(conferida_por) as conferida_por,
            coalesce(aguarda_cp, false) as aguarda_cp,
            aguarda_complementacao
        from all_sv
        left join serie_variavel sv on sv.variavel_id = all_sv.variavel_id and sv.data_valor = all_sv.data_valor and sv.serie = all_sv.serie
        left join status_variavel_ciclo_fisico svcf on svcf.variavel_id = all_sv.variavel_id and svcf.ciclo_fisico_id = ${cf.id}
        order by all_sv.serie, all_sv.codigo
        `;

        return serieVariaveis as RelSerieVariavelDto[]
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
                {
                    value: (row: RelSerieVariavelDto) => {
                        console.log('atualizado_por', { row });
                        if (!row.atualizado_por) return '';
                        return row.atualizado_por.nome_exibicao;
                    }, label: 'Atualizado Por',
                },
                { value: 'atualizado_em', label: 'Atualizado em' },
                { value: 'codigo', label: 'Código' },
                { value: 'data_valor', label: 'Data de Valor' },
                { value: 'valor_nominal', label: 'Valor Nominal' },
                {
                    value: (row: RelSerieVariavelDto) => {
                        console.log('conferida_por', { row });

                        if (!row.conferida_por) return '';
                        return row.conferida_por.nome_exibicao;
                    }, label: 'Conferida Por'
                },
                { value: 'conferida_em', label: 'Conferida Em' },
                { value: (row: RelSerieVariavelDto) => { return row.conferida ? 'Sim' : 'Não' }, label: 'Conferida' },
                { value: (row: RelSerieVariavelDto) => { return row.aguarda_cp ? 'Sim' : 'Não' }, label: 'Aguarda CP' },
                { value: (row: RelSerieVariavelDto) => { return row.aguarda_complementacao ? 'Sim' : 'Não' }, label: 'Aguarda Complementação' }
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
