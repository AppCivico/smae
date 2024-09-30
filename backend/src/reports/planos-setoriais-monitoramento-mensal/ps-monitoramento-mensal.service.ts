import { Injectable } from '@nestjs/common';
import {
    DefaultCsvOptions,
    FileOutput,
    ReportableService,
    ReportContext,
    UtilsService,
} from '../utils/utils.service';
import { RelPsMonitoramentoMensalFilterDTO } from './dto/create-ps-monitoramento-mensal-filter.dto';
import { RelPsMonitoramentoMensalVariaveis } from './entities/ps-monitoramento-mensal.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { FiltroMetasIniAtividadeDto } from '../relatorios/dto/filtros.dto';
import { Prisma } from '@prisma/client';

const {
    Parser,
    transforms: { flatten },
} = require('json2csv');
const defaultTransform = [flatten({ paths: [] })];


@Injectable()
export class MonitoramentoMensalVariaveisPs implements ReportableService {
    constructor(
        private readonly utils: UtilsService,
        private readonly prisma: PrismaService,
    ) {}
    async asJSON(params: RelPsMonitoramentoMensalFilterDTO): Promise<RelPsMonitoramentoMensalVariaveis[]> {

        //Prepara o filtro
        const filtroMetasTags = new FiltroMetasIniAtividadeDto();
        filtroMetasTags.metas_ids = params.metas;
        filtroMetasTags.tags = params.tags;
        filtroMetasTags.pdm_id = params.plano_setorial_id;

        //Confirmar se filtrar as mestas pelas Tags é o suficiente
        const { metas } = await this.utils.applyFilter(filtroMetasTags, { iniciativas: false, atividades: false });
        const metasArr = metas.map((r) => r.id);
        if (metasArr.length > 100)
            throw new Error(
                'Mais de 100 indicadores encontrados, por favor refine a busca ou utilize o relatório em CSV');

        const paramMesAno = params.ano + "-"+ params.mes + "-01";
        const linhasVariaveis = await this.prisma.$queryRaw`select
                            i.id as id_indicador,
                            i.codigo    as codigo_indicador,
                            i.titulo    as titulo_indicador,
                            v.id        as id_variavel,
                            v.codigo    as codigo_variavel,
                            v.titulo    as titulo_variavel,
                            1           as id_municipio,
                            ''          as municipio,
                            r.id        as id_regiao,
                            r.descricao as regiao,
                            1           as id_distrito,
                            ''          as distrito,
                            sv.serie,
                            sv.data_valor,
                            sv.valor_nominal,
                            sv.atualizado_em,
                            sv.data_valor + periodicidade_intervalo(v.periodicidade) as data_proximo_ciclo,
                            vgcaP.informacoes_complementares                         as analise_qualitativa_coleta,
                            vgcaV.informacoes_complementares                         as analise_qualitativa_aprovador,
                            vgcaL.informacoes_complementares                         as analise_qualitativa_liberador
                   from view_variaveis_pdm vvp
                            inner join indicador i on vvp.indicador_id = i.id
                            inner join variavel v on v.id = vvp.variavel_id
                            inner join indicador_variavel iv on i.id = iv.indicador_id
                            left join regiao r on v.regiao_id = r.id
                            left join serie_variavel sv on sv.variavel_id = v.id and sv.data_valor = ${paramMesAno}::date
                            left join variavel_global_ciclo_analise vgcaP on vgcaP.variavel_id = v.id
                        and vgcaP.referencia_data = sv.data_valor
                        and vgcaP.fase = 'Preenchimento'
                        and vgcaP.ultima_revisao = true
                        and vgcaP.removido_em is null
                     left join variavel_global_ciclo_analise vgcaV on vgcaV.variavel_id = v.id
                        and vgcaV.referencia_data = sv.data_valor
                        and vgcaV.fase = 'Validacao'
                        and vgcaV.ultima_revisao = true
                        and vgcaV.removido_em is null
                     left join variavel_global_ciclo_analise vgcaL on vgcaL.variavel_id = v.id
                        and vgcaL.referencia_data = sv.data_valor
                        and vgcaL.fase = 'Liberacao'
                        and vgcaL.ultima_revisao = true
                        and vgcaL.removido_em is null
                   where i.removido_em is null
                        and v.removido_em is null
                        and vvp.meta_id IN (${Prisma.join(metasArr)})
                        and vvp.pdm_id = ${params.plano_setorial_id}::int`;

        return linhasVariaveis as RelPsMonitoramentoMensalVariaveis[];
    }

    async toFileOutput(params: RelPsMonitoramentoMensalFilterDTO, ctx: ReportContext): Promise<FileOutput[]> {
        const rows = await this.asJSON(params);
        await ctx.progress(40);
        //Cabeçalho Arquivo
        const fieldsCSV = [
            { value: 'codigo_indicador', label: 'Código do Indicador' },
            { value: 'titulo_indicador', label: 'Título do Indicador' },
            { value: 'id_indicador', label: 'ID do Indicador' },
            { value: 'variavel_codigo', label: 'Código da Variável' },
            { value: 'variavel_titulo', label: 'Título da Variável'},
            { value: 'id_iniciativa', label: 'ID da Variável'},
            { value: 'municipio', label: 'Município' },
            { value: 'id_municipio', label: 'Código do Município' },
            { value: 'regiao', label: 'Região'},
            { value: 'regiao_id', label: 'ID da Região'},
            { value: 'subprefeitura', label: 'Subprefeitura' },
            { value: 'id_subprefeitura', label: 'ID da Subprefeitura' },
            { value: 'distrito', label: 'Distrito' },
            { value: 'id_distrito', label: 'ID do Distrito' },
            { value: 'serie', label: 'Serie' },
            { value: 'data_referencia', label: 'Data de Referencia' },
            { value: 'valor', label: 'Valor' },
            { value: 'data_preenchimento', label: 'Data de Preenchimento' },
            { value: 'anl_coleta', label: 'Analise Qualitativa Coleta' },
            { value: 'anl_aprovador', label: 'Analise Qualitativa Aprovador' },
            { value: 'anl_liberador', label: 'Analise Qualitativa Liberador' },
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
        return out;
    }



}
