import { BadRequestException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';
import { IndicadoresService } from '../indicadores/indicadores.service';
import { ReportContext } from '../relatorios/helpers/reports.contexto';
import { DefaultCsvOptions, FileOutput, ReportableService, UtilsService } from '../utils/utils.service';
import { CreatePsMonitoramentoMensalFilterDto } from './dto/create-ps-monitoramento-mensal-filter.dto';
import {
    RelPSMonitoramentoMensalCicloMetasDto,
    RelPsMonitoramentoMensalVariaveis,
    RelPsMonitRetorno,
} from './entities/ps-monitoramento-mensal.entity';

import { WriteCsvToFile, CsvWriterOptions } from 'src/common/helpers/CsvWriter';
import { flatten } from '@json2csv/transforms';

@Injectable()
export class PSMonitoramentoMensal implements ReportableService {
    constructor(
        private readonly utils: UtilsService,
        private readonly prisma: PrismaService,
        private readonly indicadoresService: IndicadoresService
    ) {}

    async asJSON(params: CreatePsMonitoramentoMensalFilterDto, user: PessoaFromJwt | null): Promise<RelPsMonitRetorno> {
        const monitoramento = await this.fetchPsMonitoramentoMensalData(params, user);

        const indicadores = await this.indicadoresService.asJSON(
            {
                ...params,
                pdm_id: params.plano_setorial_id,
                periodo: 'Geral',
                tipo: 'Mensal',
            },
            user
        );

        // Query para extrair dados de arquivo de metas do ciclo.
        const ciclo_metas = await this.buscaMetasCiclo(params, user);

        return {
            monitoramento: monitoramento,
            ciclo_metas: ciclo_metas,
            ...indicadores,
        };
    }

    private async fetchPsMonitoramentoMensalData(
        params: CreatePsMonitoramentoMensalFilterDto,
        user: PessoaFromJwt | null
    ) {
        if (!params.plano_setorial_id) params.plano_setorial_id = undefined;
        if (!params.pdm_id) params.pdm_id = undefined;

        if (!params.pdm_id && !params.plano_setorial_id) throw new BadRequestException('Informe o parâmetro pdm_id');

        const { metas } = await this.utils.applyFilter(
            {
                ...params,
                pdm_id: params.pdm_id ?? params.plano_setorial_id,
            },
            { iniciativas: false, atividades: false },
            user
        );
        const metasArr = metas.map((r) => r.id);
        if (metasArr.length > 10000)
            throw new BadRequestException('Mais de 10000 indicadores encontrados, por favor refine a busca.');

        const case_when_lib = `case when vgcaL.eh_liberacao_auto then 'Liberado retroativamente por ' || coalesce(vgcal_cp.nome_exibicao, '*') else '' end`;

        const conferida = params.conferida !== undefined ? (params.conferida ? 'true' : 'false') : 'true';

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
                            sv.data_valor as data_referencia,
                            vcv.titulo as valor_categorica,
                            round(sv.valor_nominal, v.casas_decimais) as valor_nominal,
                            sv.atualizado_em AS data_preenchimento,
                            sv.data_valor + periodicidade_intervalo(v.periodicidade) as data_proximo_ciclo,
                            coalesce(nullif(vgcaP.informacoes_complementares,''), ${case_when_lib}) as analise_qualitativa_coleta,
                            coalesce(nullif(vgcaV.informacoes_complementares,''), ${case_when_lib}) as analise_qualitativa_aprovador,
                            coalesce(nullif(vgcaL.informacoes_complementares,''), ${case_when_lib}) as analise_qualitativa_liberador,
                            v.orgao_proprietario_id,
                            variavel_orgao_proprietario.sigla as orgao_proprietario_sigla,
                            v.medicao_orgao_id as orgao_coleta_id,
                            variavel_orgao_coleta.sigla as orgao_coleta_sigla,
                            vgcal_cp.nome_exibicao as analise_qualitativa_pessoa,
                            pessoa_conferencia.nome_exibicao as analise_qualitativa_conferencia_pessoa
                    FROM view_variaveis_pdm vvp
                    INNER JOIN indicador i ON vvp.indicador_id = i.id
                    INNER JOIN variavel v ON v.id = vvp.variavel_id :listar_variaveis_regionalizadas
                    LEFT JOIN orgao variavel_orgao_proprietario ON variavel_orgao_proprietario.id = v.orgao_proprietario_id
                    LEFT JOIN orgao variavel_orgao_coleta ON variavel_orgao_coleta.id = v.medicao_orgao_id
                    LEFT JOIN regiao r ON v.regiao_id = r.id
                    INNER JOIN serie_variavel sv ON sv.variavel_id = v.id and sv.data_valor = :mesAno ::date
                        AND conferida = ${conferida}::boolean
                    LEFT JOIN variavel_global_ciclo_analise vgcaP ON vgcaP.variavel_id = coalesce(v.variavel_mae_id, v.id)
                        and vgcaP.referencia_data = sv.data_valor
                        and vgcaP.fase = 'Preenchimento'
                        and vgcaP.ultima_revisao = true
                        and vgcaP.removido_em is null
                        and vgcaP.aprovada = true
                    LEFT JOIN variavel_global_ciclo_analise vgcaV ON vgcaV.variavel_id = coalesce(v.variavel_mae_id, v.id)
                        and vgcaV.referencia_data = sv.data_valor
                        and vgcaV.fase = 'Validacao'
                        and vgcaV.ultima_revisao = true
                        and vgcaV.removido_em is null
                        and vgcaV.aprovada = true
                    LEFT JOIN variavel_global_ciclo_analise vgcaL ON vgcaL.variavel_id = coalesce(v.variavel_mae_id, v.id)
                        and vgcaL.referencia_data = sv.data_valor
                        and vgcaL.fase = 'Liberacao'
                        and vgcaL.ultima_revisao = true
                        and vgcaL.removido_em is null
                        and vgcaL.aprovada = true
                    LEFT JOIN pessoa vgcal_cp ON vgcaL.criado_por = vgcal_cp.id
                    LEFT JOIN variavel_categorica_valor vcv ON vcv.id = sv.variavel_categorica_valor_id
                    LEFT JOIN pessoa pessoa_conferencia ON vgcaV.criado_por = pessoa_conferencia.id
                   where i.removido_em is null
                        and v.removido_em is null
                        and vvp.meta_id IN (:metas)`;

        if (params.listar_variaveis_regionalizadas) {
            sql = sql.replace(':listar_variaveis_regionalizadas', ' or v.variavel_mae_id = vvp.variavel_id ');
        } else {
            sql = sql.replace(':listar_variaveis_regionalizadas', '');
        }
        if (metasArr.length === 0) metasArr.push(-1); // hack para evitar erro de sintaxe no SQL
        sql = sql.replace(':metas', metasArr.toString());
        sql = sql.replace(':mesAno', "'" + paramMesAno + "'");
        const linhasVariaveis = (await this.prisma.$queryRawUnsafe(sql)) as any;

        return linhasVariaveis as RelPsMonitoramentoMensalVariaveis[];
    }

    // TODO: aprimorar/otimizar parte de filtros para não repetir código.
    private async buscaMetasCiclo(
        params: CreatePsMonitoramentoMensalFilterDto,
        user: PessoaFromJwt | null
    ): Promise<RelPSMonitoramentoMensalCicloMetasDto[]> {
        if (!params.plano_setorial_id) params.plano_setorial_id = undefined;
        if (!params.pdm_id) params.pdm_id = undefined;

        if (!params.pdm_id && !params.plano_setorial_id) throw new BadRequestException('Informe o parâmetro pdm_id');

        const { metas } = await this.utils.applyFilter(
            {
                ...params,
                pdm_id: params.pdm_id ?? params.plano_setorial_id,
                tipo_pdm: 'PS',
            },
            { iniciativas: true, atividades: true },
            user
        );
        const metasArr = metas.map((r) => r.id);

        if (metasArr.length > 10000)
            throw new BadRequestException('Mais de 10000 indicadores encontrados, por favor refine a busca.');

        const paramMesAno = params.ano + '-' + params.mes + '-01';

        // Query para extrair dados de arquivo de metas do ciclo.
        // retorno deve ser no modelo RelPSMonitoramentoMensalCicloMetasDto
        // os dados principais vem da tabela ciclo_fisico, e será feito join com as tables meta_ciclo_fisico_analise e meta_ciclo_fisico_risco
        // para trazer informações adicionais.
        const sql = `select
                m.id as meta_id,
                m.codigo as meta_codigo,
                coalesce(mcf.informacoes_complementares,'') as analise_qualitativa,
                mcf.referencia_data as analise_qualitativa_data,
                coalesce(mcr.detalhamento,'') as risco_detalhamento,
                coalesce(mcr.ponto_de_atencao,'') as risco_ponto_atencao,
                coalesce(mcfec.comentario,'') as fechamento_comentario
            from ciclo_fisico cf
            join pdm p on p.id = cf.pdm_id and p.removido_em is null AND p.tipo = 'PS'
            join meta m on m.pdm_id = p.id and m.removido_em is null
            left join meta_ciclo_fisico_analise mcf on mcf.ciclo_fisico_id = cf.id and mcf.meta_id = m.id and mcf.removido_em is null and mcf.ultima_revisao = true and mcf.referencia_data = :mesAno ::date
            left join meta_ciclo_fisico_risco mcr on mcr.ciclo_fisico_id = cf.id and mcr.meta_id = m.id and mcr.removido_em is null and mcr.ultima_revisao = true  and mcr.referencia_data = :mesAno ::date
            left join meta_ciclo_fisico_fechamento mcfec on mcfec.ciclo_fisico_id = cf.id and mcfec.meta_id = m.id and mcfec.removido_em is null and mcfec.ultima_revisao = true and mcfec.referencia_data = :mesAno ::date
            where m.id in (:metas)
            and cf.pdm_id = :pdm_id
            and cf.ativo = true
            `;

        // Fazendo replace de :metas, :mesAno e :pdm_id
        const sqlMetas = sql
            .replace(':metas', metasArr.length ? metasArr.toString() : '0')
            .replace(/:mesAno/g, "'" + paramMesAno + "'")
            .replace(':pdm_id', params.pdm_id!.toString());

        const linhasMetas = (await this.prisma.$queryRawUnsafe(sqlMetas)) as any;
        return linhasMetas as RelPSMonitoramentoMensalCicloMetasDto[];
    }

    //TODO implementar paginação para evitar memory overflow
    async toFileOutput(
        params: CreatePsMonitoramentoMensalFilterDto,
        ctx: ReportContext,
        user: PessoaFromJwt | null
    ): Promise<FileOutput[]> {
        const out: FileOutput[] = [];
        if (params.tipo_pdm == 'PS') {
            const rows = await this.fetchPsMonitoramentoMensalData(params, user);
            ctx.resumoSaida('Monitoramento Mensal Variáveis PS', rows.length);
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
                { value: 'subprefeitura_id', label: 'ID da Subprefeitura' },
                { value: 'distrito', label: 'Distrito' },
                { value: 'distrito_id', label: 'ID do Distrito' },
                { value: 'serie', label: 'Serie' },
                { value: 'data_referencia', label: 'Data de Referencia' },
                { value: 'valor_nominal', label: 'Valor Nominal' },
                { value: 'valor_categorica', label: 'Valor Categórica' },
                { value: 'data_preenchimento', label: 'Data da Coleta' },
                { value: 'analise_qualitativa_coleta', label: 'Analise Qualitativa Coleta' },
                { value: 'analise_qualitativa_aprovador', label: 'Analise Qualitativa Conferidor' },
                { value: 'analise_qualitativa_liberador', label: 'Analise Qualitativa Liberador' },
            ];

            const transforms = [flatten()];

            if (rows.length) {
                const reportTmpVars = ctx.getTmpFile('monitoramento-mensal-variaveis-ps.csv');
                const varsCsvOptions: CsvWriterOptions<RelPsMonitoramentoMensalVariaveis> = {
                    csvOptions: DefaultCsvOptions,
                    transforms,
                    fields: fieldsCSV,
                };
                await WriteCsvToFile(rows, reportTmpVars.stream, varsCsvOptions);
                out.push({ name: 'monitoramento-mensal-variaveis-ps.csv', localFile: reportTmpVars.path });
            }

            const cicloMetasRows = await this.buscaMetasCiclo(params, user);
            ctx.resumoSaida('Monitoramento Mensal Metas Ciclo PS', cicloMetasRows.length);

            if (cicloMetasRows.length) {
                const reportTmpMetas = ctx.getTmpFile('monitoramento-mensal-metas-ciclo-ps.csv');
                const metasCsvOptions: CsvWriterOptions<RelPSMonitoramentoMensalCicloMetasDto> = {
                    csvOptions: DefaultCsvOptions,
                    transforms,
                    fields: [
                        { value: 'meta_id', label: 'ID da Meta' },
                        { value: 'meta_codigo', label: 'Código da Meta' },
                        { value: 'analise_qualitativa', label: 'Analise Qualitativa' },
                        { value: 'analise_qualitativa_data', label: 'Data da Analise Qualitativa' },
                        { value: 'risco_detalhamento', label: 'Detalhamento do Risco' },
                        { value: 'risco_ponto_atencao', label: 'Ponto de Atenção do Risco' },
                        { value: 'fechamento_comentario', label: 'Comentário de Fechamento' },
                    ],
                };
                await WriteCsvToFile(cicloMetasRows, reportTmpMetas.stream, metasCsvOptions);
                out.push({
                    name: 'monitoramento-mensal-metas-ciclo-ps.csv',
                    localFile: reportTmpMetas.path
                });
            }
        } else {
            // TODO: redirect pro resto do relatórios do relatório mensal do PDM antigo
        }

        const indicadores = await this.indicadoresService.toFileOutput(
            {
                ...params,
                pdm_id: params.pdm_id,
                periodo: 'Geral',
                tipo: 'Mensal',
            },
            ctx,
            user
        );
        for (const indicador of indicadores) {
            out.push(indicador);
        }
        return out;
    }
}
