import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IndicadoresService } from '../indicadores/indicadores.service';
import { DefaultCsvOptions, FileOutput, ReportableService, ReportContext, UtilsService } from '../utils/utils.service';
import { CreatePsMonitoramentoMensalFilterDto } from './dto/create-ps-monitoramento-mensal-filter.dto';
import { RelPsMonitoramentoMensalVariaveis } from './entities/ps-monitoramento-mensal.entity';

const {
    Parser,
    transforms: { flatten },
} = require('json2csv');
const defaultTransform = [flatten({ paths: [] })];

@Injectable()
export class PSMonitoramentoMensal implements ReportableService {
    constructor(
        private readonly utils: UtilsService,
        private readonly prisma: PrismaService,
        private readonly indicadoresService: IndicadoresService
    ) {}

    async asJSON(params: CreatePsMonitoramentoMensalFilterDto): Promise<RelPsMonitoramentoMensalVariaveis[]> {
        if (!params.plano_setorial_id) params.plano_setorial_id = undefined;
        if (!params.pdm_id) params.pdm_id = undefined;

        if (!params.pdm_id && !params.plano_setorial_id) throw new BadRequestException('Informe o parâmetro pdm_id');

        const { metas } = await this.utils.applyFilter(
            {
                ...params,
                pdm_id: params.plano_setorial_id,
            },
            { iniciativas: false, atividades: false }
        );
        const metasArr = metas.map((r) => r.id);
        if (metasArr.length > 100)
            throw new Error(
                'Mais de 100 indicadores encontrados, por favor refine a busca ou utilize o relatório em CSV'
            );

        const case_when_lib = `case when vgcaL.eh_liberacao_auto then 'Liberado retroativamente por ' || coalesce(vgcal_cp.nome_exibicao, '*') else '' end`;

        const paramMesAno = params.ano + '-' + params.mes + '-01';
        let sql: string = `select
                            i.id as indicador_id,
                            i.codigo    as codigo_indicador,
                            i.titulo    as titulo_indicador,
                            v.id        as variavel_id,
                            v.codigo    as codigo_variavel,
                            v.titulo    as titulo_variavel,
                            case
                                when r.nivel = 1 then r.descricao
                                when r.nivel = 2 then (select mun.descricao from regiao mun where mun.id = r.parente_id)
                                when r.nivel = 3 then (select mun.descricao
                                                       from regiao rr
                                                                inner join regiao mun on rr.parente_id = mun.id
                                                       where r.parente_id = rr.id)
                                when r.nivel = 4 then (select mun.descricao
                                                       from regiao rr
                                                                inner join regiao mun on rr.parente_id = mun.id
                                                                inner join regiao dist
                                                                           on dist.id = rr.parente_id
                                                       where r.parente_id = rr.id)
                                end as municipio,
                            case
                                when r.nivel = 1 then r.id
                                when r.nivel = 2 then (select mun.id from regiao mun where mun.id = r.parente_id)
                                when r.nivel = 3 then (select mun.id
                                                       from regiao rr
                                                                inner join regiao mun on rr.parente_id = mun.id
                                                       where r.parente_id = rr.id)
                                when r.nivel = 4 then (select mun.id
                                                       from regiao rr
                                                                inner join regiao mun on rr.parente_id = mun.id
                                                                inner join regiao dist
                                                                           on dist.id = rr.parente_id
                                                       where r.parente_id = rr.id)
                                end as municipio_id,
                            case
                                when r.nivel = 1 then null
                                when r.nivel = 2 then r.descricao
                                when r.nivel = 3 then (select reg.descricao from regiao reg where reg.id = r.parente_id)
                                when r.nivel = 4 then (select reg.descricao
                                                       from regiao rr
                                                                inner join regiao reg on rr.parente_id = reg.id
                                                                inner join regiao dist
                                                                           on dist.id = rr.parente_id
                                                       where r.parente_id = rr.id)
                                end as regiao,
                            case
                                when r.nivel = 1 then null
                                when r.nivel = 2 then r.id
                                when r.nivel = 3 then (select reg.id from regiao reg where reg.id = r.parente_id)
                                when r.nivel = 4 then (select reg.id
                                                       from regiao rr
                                                                inner join regiao reg on rr.parente_id = reg.id
                                                                inner join regiao dist
                                                                           on dist.id = rr.parente_id
                                                       where r.parente_id = rr.id)
                                end as regiao_id,
                            case
                                when r.nivel in (1, 2) then null
                                when r.nivel = 3 then r.id
                                when r.nivel = 4 then (select reg.id from regiao reg where reg.id = r.parente_id)
                                end as subprefeitura_id,
                            case
                                when r.nivel in (1, 2) then null
                                when r.nivel = 3 then r.descricao
                                when r.nivel = 4 then (select reg.descricao from regiao reg where reg.id = r.parente_id)
                                end as subprefeitura,
                            case
                                when r.nivel in (1, 2, 3) then null
                                when r.nivel = 4 then r.descricao
                                end as distrito,
                            case
                                when r.nivel in (1, 2, 3) then null
                                when r.nivel = 4 then r.id
                                end as distrito_id,
                            sv.serie,
                            sv.data_valor,
                            sv.valor_nominal,
                            sv.atualizado_em,
                            sv.data_valor + periodicidade_intervalo(v.periodicidade) as data_proximo_ciclo,
                            coalesce(nullif(vgcaP.informacoes_complementares,''), ${case_when_lib}) as analise_qualitativa_coleta,
                            coalesce(nullif(vgcaV.informacoes_complementares,''), ${case_when_lib}) as analise_qualitativa_aprovador,
                            coalesce(nullif(vgcaL.informacoes_complementares,''), ${case_when_lib}) as analise_qualitativa_liberador
                   from view_variaveis_pdm vvp
                            inner join indicador i on vvp.indicador_id = i.id
                            inner join variavel v on v.id = vvp.variavel_id :listar_variaveis_regionalizadas
                            left join regiao r on v.regiao_id = r.id
                            left join serie_variavel sv on sv.variavel_id = v.id and sv.data_valor = :mesAno ::date
                     left join variavel_global_ciclo_analise vgcaP on vgcaP.variavel_id = coalesce(v.variavel_mae_id, v.id)
                        and vgcaP.referencia_data = sv.data_valor
                        and vgcaP.fase = 'Preenchimento'
                        and vgcaP.ultima_revisao = true
                        and vgcaP.removido_em is null
                     left join variavel_global_ciclo_analise vgcaV on vgcaV.variavel_id = coalesce(v.variavel_mae_id, v.id)
                        and vgcaV.referencia_data = sv.data_valor
                        and vgcaV.fase = 'Validacao'
                        and vgcaV.ultima_revisao = true
                        and vgcaV.removido_em is null
                     left join variavel_global_ciclo_analise vgcaL on vgcaL.variavel_id = coalesce(v.variavel_mae_id, v.id)
                        and vgcaL.referencia_data = sv.data_valor
                        and vgcaL.fase = 'Liberacao'
                        and vgcaL.ultima_revisao = true
                        and vgcaL.removido_em is null
                     left join pessoa vgcal_cp on vgcaL.criado_por = vgcal_cp.id

                   where i.removido_em is null
                        and v.removido_em is null
                        and vvp.meta_id IN (:metas)
                        and vvp.pdm_id = ${params.plano_setorial_id}::int`;

        if (params.listar_variaveis_regionalizadas) {
            sql = sql.replace(':listar_variaveis_regionalizadas', ' or v.variavel_mae_id = vvp.variavel_id ');
        } else {
            sql = sql.replace(':listar_variaveis_regionalizadas', '');
        }
        if (metasArr.length === 0) metasArr.push(-1); // hack para evitar erro de sintaxe no SQL
        sql = sql.replace(':metas', metasArr.toString());
        sql = sql.replace(':mesAno', "'" + paramMesAno + "'");
        const linhasVariaveis = await this.prisma.$queryRawUnsafe(sql);

        return linhasVariaveis as RelPsMonitoramentoMensalVariaveis[];
    }

    //TODO implementar paginação para evitar memory overflow
    async toFileOutput(params: CreatePsMonitoramentoMensalFilterDto, ctx: ReportContext): Promise<FileOutput[]> {
        const rows = await this.asJSON(params);
        await ctx.progress(40);
        //Cabeçalho Arquivo
        const fieldsCSV = [
            { value: 'codigo_indicador', label: 'Código do Indicador' },
            { value: 'titulo_indicador', label: 'Título do Indicador' },
            { value: 'indicador_id', label: 'ID do Indicador' },
            { value: 'codigo_variavel', label: 'Código da Variável' },
            { value: 'titulo_variavel', label: 'Título da Variável' },
            { value: 'variavel_id', label: 'ID da Variável' },
            { value: 'municipio', label: 'Município' },
            { value: 'municipio_id', label: 'Código do Município' },
            { value: 'regiao', label: 'Região' },
            { value: 'regiao_id', label: 'ID da Região' },
            { value: 'subprefeitura', label: 'Subprefeitura' },
            { value: 'id_subprefeitura', label: 'ID da Subprefeitura' },
            { value: 'distrito', label: 'Distrito' },
            { value: 'distrito_id', label: 'ID do Distrito' },
            { value: 'serie', label: 'Serie' },
            { value: 'data_referencia', label: 'Data de Referencia' },
            { value: 'valor', label: 'Valor' },
            { value: 'data_preenchimento', label: 'Data de Preenchimento' },
            { value: 'analise_qualitativa_coleta', label: 'Analise Qualitativa Coleta' },
            { value: 'analise_qualitativa_aprovador', label: 'Analise Qualitativa Aprovador' },
            { value: 'analise_qualitativa_liberador', label: 'Analise Qualitativa Liberador' },
        ];

        const out: FileOutput[] = [];
        if (rows.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
                fields: fieldsCSV,
            });

            const linhas = json2csvParser.parse(rows);
            out.push({
                name: 'monitoramento-mensal-variaveis-ps.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }

        const indicadores = await this.indicadoresService.toFileOutput(
            {
                ...params,
                pdm_id: params.plano_setorial_id,
                tipo_pdm: 'PS',
                periodo: 'Geral',
                tipo: 'Mensal',
            },
            ctx
        );
        for (const indicador of indicadores) {
            out.push(indicador);
        }
        return out;
    }
}
