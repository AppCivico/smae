import { BadRequestException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';
import { IndicadoresService } from '../indicadores/indicadores.service';
import { getReportRowSchema } from '../post-process/report-column.decorator';
import { isSchemaAware, ReportFileSchema, SchemaAwareReportableService } from '../post-process/report-schema';
import { CreateRelIndicadorDto } from '../indicadores/dto/create-indicadores.dto';
import { ReportContext } from '../relatorios/helpers/reports.contexto';
import {
    DefaultCsvOptions,
    DefaultTransforms,
    FileOutput,
    Path2FileName,
    ReportableService,
    UtilsService,
} from '../utils/utils.service';
import { CreatePsMonitoramentoMensalFilterDto } from './dto/create-ps-monitoramento-mensal-filter.dto';
import {
    RelPsMonitoramentoMensalAnaliseQualitativaCsvRow,
    RelPsMonitoramentoMensalFechamentoCsvRow,
    RelPsMonitoramentoMensalMetasCicloCsvRow,
    RelPsMonitoramentoMensalRiscoCsvRow,
    RelPsMonitoramentoMensalVariaveisCsvRow,
} from './entities/ps-monitoramento-mensal-csv.entity';
import {
    RelPSMonitoramentoMensalCicloMetasDto,
    RelPsMonitoramentoMensalVariaveis,
    RelPsMonitRetorno,
} from './entities/ps-monitoramento-mensal.entity';

import { CsvWriterOptions, WriteCsvToFile } from 'src/common/helpers/CsvWriter';
import { Date2YMD } from '../../common/date2ymd';
import { Html2Text } from '../../common/Html2Text';

/**
 * Helpers de normalização para o CSV **bruto**.
 *
 * As linhas vêm de `$queryRawUnsafe`, então o adapter do Prisma devolve `Date` para
 * `date`/`timestamptz` e `Decimal` para `numeric`. O json2csv serializaria esses objetos
 * pelo `toJSON()` (data vira ISO completo com `Z`, mesmo em coluna que é só data), e o
 * DuckDB precisa de ISO limpo por tipo declarado — daí a conversão explícita aqui.
 *
 * Ausência de valor sempre vira `null` (nunca `''`): o `read_csv` do pós-processamento usa
 * `nullstr = ''`, e é o `null` que faz a coluna tipada aceitar a linha.
 */

/** `Date` (ou string ISO) → `YYYY-MM-DD`, para colunas declaradas como `DATE`. */
function csvData(valor: Date | string | null | undefined): string | null {
    if (valor == null) return null;
    if (valor instanceof Date) return Date2YMD.toString(valor);
    return String(valor).substring(0, 10);
}

/** `Date` (ou string ISO) → ISO completo em UTC, para colunas declaradas como `TIMESTAMP`. */
function csvTimestamp(valor: Date | string | null | undefined): string | null {
    if (valor == null) return null;
    if (valor instanceof Date) return valor.toISOString();
    return String(valor);
}

/**
 * Texto que já pode vir vazio do `coalesce(..., '')` do SQL: vazio é ausência de valor.
 * Não altero o `coalesce` porque a mesma consulta alimenta o `asJSON` (contrato da API).
 */
function csvTexto(valor: string | null | undefined): string | null {
    if (valor == null) return null;
    return valor === '' ? null : valor;
}

/**
 * `Decimal` do Prisma → string, para colunas declaradas como `DECIMAL`.
 *
 * `toNumber()` passaria por `double` e perderia precisão; o DuckDB relê a coluna já como
 * `DECIMAL(18,4)`, então a string é convertida de forma exata.
 */
function csvDecimal(valor: unknown): string | null {
    if (valor == null) return null;
    return String(valor);
}

class PSQualiCsv {
    id: number;
    criador_nome_exibicao: string | null;
    criado_em: string | null;
    informacoes_complementares: string | null;
    informacoes_complementares_texto: string | null;
    referencia_data: string | null;
    meta_id: number;
    meta_titulo: string | null;
    meta_codigo: string | null;
}

class PSRiscoCsv {
    id: number;
    criador_nome_exibicao: string | null;
    criado_em: string | null;
    detalhamento: string | null;
    detalhamento_texto: string | null;
    ponto_de_atencao: string | null;
    ponto_de_atencao_texto: string | null;
    referencia_data: string | null;
    meta_id: number;
    meta_titulo: string | null;
    meta_codigo: string | null;
}

class PSFechamentoCsv {
    id: number;
    criador_nome_exibicao: string | null;
    criado_em: string | null;
    comentario: string | null;
    referencia_data: string | null;
    meta_id: number;
    meta_titulo: string | null;
    meta_codigo: string | null;
}

@Injectable()
export class PSMonitoramentoMensal implements ReportableService, SchemaAwareReportableService {
    constructor(
        private readonly utils: UtilsService,
        private readonly prisma: PrismaService,
        private readonly indicadoresService: IndicadoresService
    ) {}

    async asJSON(params: CreatePsMonitoramentoMensalFilterDto, user: PessoaFromJwt | null): Promise<RelPsMonitRetorno> {
        const monitoramento = await this.fetchPsMonitoramentoMensalData(params, user);

        const indicadores = await this.indicadoresService.asJSON(this.paramsIndicadores(params), user);

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
                m.titulo as meta_titulo,
                coalesce(mcf.informacoes_complementares,'') as analise_qualitativa,
                mcf.referencia_data as analise_qualitativa_data,
                mcf.id as analise_id,
                mcf.criado_em as analise_criado_em,
                p_mcf.nome_exibicao as analise_criador,
                coalesce(mcr.detalhamento,'') as risco_detalhamento,
                coalesce(mcr.ponto_de_atencao,'') as risco_ponto_atencao,
                mcr.id as risco_id,
                mcr.criado_em as risco_criado_em,
                p_mcr.nome_exibicao as risco_criador,
                mcr.referencia_data as risco_referencia_data,
                coalesce(mcfec.comentario,'') as fechamento_comentario,
                mcfec.id as fechamento_id,
                mcfec.criado_em as fechamento_criado_em,
                p_mcfec.nome_exibicao as fechamento_criador,
                mcfec.referencia_data as fechamento_referencia_data
            from ciclo_fisico cf
            join pdm p on p.id = cf.pdm_id and p.removido_em is null
            join meta m on m.pdm_id = p.id and m.removido_em is null
            left join meta_ciclo_fisico_analise mcf on mcf.ciclo_fisico_id = cf.id and mcf.meta_id = m.id and mcf.removido_em is null and mcf.ultima_revisao = true
            left join pessoa p_mcf on p_mcf.id = mcf.criado_por
            left join meta_ciclo_fisico_risco mcr on mcr.ciclo_fisico_id = cf.id and mcr.meta_id = m.id and mcr.removido_em is null and mcr.ultima_revisao = true
            left join pessoa p_mcr on p_mcr.id = mcr.criado_por
            left join meta_ciclo_fisico_fechamento mcfec on mcfec.ciclo_fisico_id = cf.id and mcfec.meta_id = m.id and mcfec.removido_em is null and mcfec.ultima_revisao = true
            left join pessoa p_mcfec on p_mcfec.id = mcfec.criado_por
            where m.id in (:metas)
            and cf.pdm_id = :pdm_id
            and cf.data_ciclo = :mesAno ::date
            `;

        // Fazendo replace de :metas, :mesAno e :pdm_id
        // aceita tanto pdm_id quanto plano_setorial_id (como applyFilter/fetch já fazem),
        // evitando 500 quando o chamador envia apenas plano_setorial_id
        const pdmId = params.pdm_id ?? params.plano_setorial_id;
        const sqlMetas = sql
            .replace(':metas', metasArr.length ? metasArr.toString() : '0')
            .replace(/:mesAno/g, "'" + paramMesAno + "'")
            .replace(':pdm_id', pdmId!.toString());

        const linhasMetas = (await this.prisma.$queryRawUnsafe(sqlMetas)) as RelPSMonitoramentoMensalCicloMetasDto[];

        // Além da versão HTML, expõe a versão em texto limpo dos campos HTML,
        // igualando o que já é gerado nos CSVs (colunas "(Texto)") do relatório em Excel.
        return linhasMetas.map((row) => ({
            ...row,
            analise_qualitativa_texto: Html2Text(row.analise_qualitativa),
            risco_detalhamento_texto: Html2Text(row.risco_detalhamento),
            risco_ponto_atencao_texto: Html2Text(row.risco_ponto_atencao),
        }));
    }

    /**
     * Params repassados ao `IndicadoresService`.
     *
     * Ponto único de verdade: `describeSchema` e `toFileOutput` **precisam** montar isto do
     * mesmo jeito, senão o schema descrito não corresponde ao arquivo emitido (o schema de
     * indicadores depende de `pdm_id` e `tipo_pdm` — é dele que saem os rótulos configuráveis
     * do PDM e a presença da coluna `pdm_nome`).
     */
    private paramsIndicadores(params: CreatePsMonitoramentoMensalFilterDto): CreateRelIndicadorDto {
        return {
            ...params,
            pdm_id: params.pdm_id ?? params.plano_setorial_id,
            periodo: 'Geral',
            tipo: 'Mensal',
        };
    }

    /**
     * Schemas dos CSVs brutos, na mesma ordem em que `toFileOutput` os emite.
     *
     * Todos os cinco arquivos próprios são condicionais (só saem quando há linhas); declarar
     * todos aqui é o correto — o `aplicarModelo` casa schema com arquivo pelo nome e ignora,
     * sem ruído, os schemas cujo arquivo não foi produzido.
     *
     * No fim vêm os schemas do `IndicadoresService`, porque `toFileOutput` anexa os arquivos
     * dele (`indicadores.csv` e `regioes.csv`) à saída deste relatório. Sem isso o
     * pós-processamento não acha schema para esses dois e os repassa **crus** — cabeçalho
     * técnico (`meta__codigo`), sem formatação pt-BR, sem XLSX e sem os rótulos configuráveis
     * do PDM. Nenhum dos dois nomes colide com os cinco arquivos próprios, então o
     * `findFileSchema` (que casa pelo primeiro schema com aquele nome) não fica ambíguo.
     *
     * O `isSchemaAware` é um teste em **runtime de propósito**, não um import das classes de
     * linha do relatório de indicadores: a migração daquele serviço vive em outro PR, e este
     * branch não tem as entidades dele. Assim o código compila e roda sozinho (o guard dá
     * `false` e a saída é a de hoje) e passa a formatar os dois arquivos automaticamente
     * assim que o serviço de indicadores ganhar `describeSchema`.
     */
    async describeSchema(params: CreatePsMonitoramentoMensalFilterDto): Promise<ReportFileSchema[]> {
        const doIndicador = isSchemaAware(this.indicadoresService)
            ? await this.indicadoresService.describeSchema(this.paramsIndicadores(params))
            : [];

        return [
            getReportRowSchema(RelPsMonitoramentoMensalVariaveisCsvRow),
            getReportRowSchema(RelPsMonitoramentoMensalMetasCicloCsvRow),
            getReportRowSchema(RelPsMonitoramentoMensalAnaliseQualitativaCsvRow),
            getReportRowSchema(RelPsMonitoramentoMensalRiscoCsvRow),
            getReportRowSchema(RelPsMonitoramentoMensalFechamentoCsvRow),
            ...doIndicador,
        ];
    }

    //TODO implementar paginação para evitar memory overflow
    async toFileOutput(
        params: CreatePsMonitoramentoMensalFilterDto,
        ctx: ReportContext,
        user: PessoaFromJwt | null
    ): Promise<FileOutput[]> {
        const out: FileOutput[] = [];

        const rows = await this.fetchPsMonitoramentoMensalData(params, user);
        ctx.resumoSaida('Monitoramento Mensal Variáveis PS/PDMv2', rows.length);
        await ctx.progress(40);

        // Depois do `fetch`: ele é quem valida `pdm_id`/`plano_setorial_id` e devolve 400 quando
        // faltam. O `describeSchema` agora consulta o PDM (para os rótulos do relatório de
        // indicadores), então chamá-lo antes trocaria esse 400 por um erro de Prisma.
        // Os schemas de indicadores vêm depois dos cinco daqui e não são usados neste método —
        // quem os consome é o pós-processamento, sobre os arquivos anexados no fim.
        const [schemaVariaveis, schemaMetasCiclo, schemaQuali, schemaRisco, schemaFechamento] =
            await this.describeSchema(params);

        if (rows.length) {
            const reportTmpVars = ctx.getTmpFile('monitoramento-mensal-variaveis-ps.csv');

            // CSV bruto: só o "compute store". Rótulos, `dd/mm/aaaa` e separador decimal
            // pt-BR vêm do schema em `ps-monitoramento-mensal-csv.entity.ts`, aplicados no
            // pós-processamento.
            const varsRows: RelPsMonitoramentoMensalVariaveisCsvRow[] = rows.map((row) => ({
                codigo_indicador: row.codigo_indicador,
                titulo_indicador: row.titulo_indicador,
                indicador_id: row.indicador_id,
                codigo_variavel: row.codigo_variavel,
                titulo_variavel: row.titulo_variavel,
                variavel_id: row.variavel_id,
                municipio: row.municipio,
                municipio_id: row.municipio_id,
                regiao: row.regiao,
                regiao_id: row.regiao_id,
                subprefeitura: row.subprefeitura,
                subprefeitura_id: row.subprefeitura_id,
                distrito: row.distrito,
                distrito_id: row.distrito_id,
                serie: row.serie,
                data_referencia: csvData(row.data_referencia),
                valor_nominal: csvDecimal(row.valor_nominal),
                valor_categorica: row.valor_categorica,
                // `eh_previa` só existe em `serie_indicador` (nível indicador); esta consulta
                // lê `serie_variavel`, onde o conceito não existe. A coluna sempre saiu vazia
                // e continua saindo — o levantamento completo está na nota da entidade.
                eh_previa: null,
                data_preenchimento: csvTimestamp(row.data_preenchimento),
                analise_qualitativa_coleta: csvTexto(row.analise_qualitativa_coleta),
                analise_qualitativa_aprovador: csvTexto(row.analise_qualitativa_aprovador),
                analise_qualitativa_liberador: csvTexto(row.analise_qualitativa_liberador),
            }));

            const varsCsvOptions: CsvWriterOptions<RelPsMonitoramentoMensalVariaveisCsvRow> = {
                csvOptions: DefaultCsvOptions,
                transforms: DefaultTransforms,
                fields: schemaVariaveis.colunas.map((c) => c.name),
            };
            await WriteCsvToFile(varsRows, reportTmpVars.stream, varsCsvOptions);
            out.push({ name: 'monitoramento-mensal-variaveis-ps.csv', localFile: reportTmpVars.path });
        }

        const cicloMetasRows = await this.buscaMetasCiclo(params, user);
        ctx.resumoSaida('Monitoramento Mensal Metas Ciclo PS', cicloMetasRows.length);

        if (cicloMetasRows.length) {
            const reportTmpMetas = ctx.getTmpFile('monitoramento-mensal-metas-ciclo-ps.csv');
            // `Html2Text` continua na extração: é limpeza de conteúdo (o campo é HTML no
            // banco), não formatação de locale.
            const mainCsvRows: RelPsMonitoramentoMensalMetasCicloCsvRow[] = cicloMetasRows.map((row) => ({
                meta_id: row.meta_id,
                meta_codigo: row.meta_codigo,
                analise_qualitativa: csvTexto(Html2Text(row.analise_qualitativa)),
                analise_qualitativa_data: csvData(row.analise_qualitativa_data),
                risco_detalhamento: csvTexto(Html2Text(row.risco_detalhamento)),
                risco_ponto_atencao: csvTexto(Html2Text(row.risco_ponto_atencao)),
                fechamento_comentario: csvTexto(row.fechamento_comentario),
            }));
            const metasCsvOptions: CsvWriterOptions<RelPsMonitoramentoMensalMetasCicloCsvRow> = {
                csvOptions: DefaultCsvOptions,
                transforms: DefaultTransforms,
                fields: schemaMetasCiclo.colunas.map((c) => c.name),
            };
            await WriteCsvToFile(mainCsvRows, reportTmpMetas.stream, metasCsvOptions);
            out.push({
                name: 'monitoramento-mensal-metas-ciclo-ps.csv',
                localFile: reportTmpMetas.path,
            });
        }

        const qualiRows: PSQualiCsv[] = [];
        const riscoRows: PSRiscoCsv[] = [];
        const fechamentoRows: PSFechamentoCsv[] = [];

        for (const row of cicloMetasRows) {
            if (row.analise_id) {
                qualiRows.push({
                    id: row.analise_id,
                    criador_nome_exibicao: csvTexto(row.analise_criador),
                    criado_em: csvTimestamp(row.analise_criado_em),
                    informacoes_complementares: csvTexto(row.analise_qualitativa),
                    informacoes_complementares_texto: csvTexto(Html2Text(row.analise_qualitativa)),
                    referencia_data: csvData(row.analise_qualitativa_data),
                    meta_id: row.meta_id,
                    meta_titulo: row.meta_titulo,
                    meta_codigo: row.meta_codigo,
                });
            }
            if (row.risco_id) {
                riscoRows.push({
                    id: row.risco_id,
                    criador_nome_exibicao: csvTexto(row.risco_criador),
                    criado_em: csvTimestamp(row.risco_criado_em),
                    detalhamento: csvTexto(row.risco_detalhamento),
                    detalhamento_texto: csvTexto(Html2Text(row.risco_detalhamento)),
                    ponto_de_atencao: csvTexto(row.risco_ponto_atencao),
                    ponto_de_atencao_texto: csvTexto(Html2Text(row.risco_ponto_atencao)),
                    referencia_data: csvData(row.risco_referencia_data),
                    meta_id: row.meta_id,
                    meta_titulo: row.meta_titulo,
                    meta_codigo: row.meta_codigo,
                });
            }
            if (row.fechamento_id) {
                fechamentoRows.push({
                    id: row.fechamento_id,
                    criador_nome_exibicao: csvTexto(row.fechamento_criador),
                    criado_em: csvTimestamp(row.fechamento_criado_em),
                    comentario: csvTexto(row.fechamento_comentario),
                    referencia_data: csvData(row.fechamento_referencia_data),
                    meta_id: row.meta_id,
                    meta_titulo: row.meta_titulo,
                    meta_codigo: row.meta_codigo,
                });
            }
        }

        if (qualiRows.length) {
            const tmp = ctx.getTmpFile('analises-qualitativas-ps.csv');
            const opts: CsvWriterOptions<PSQualiCsv> = {
                csvOptions: DefaultCsvOptions,
                transforms: DefaultTransforms,
                fields: schemaQuali.colunas.map((c) => c.name),
            };
            await WriteCsvToFile(qualiRows, tmp.stream, opts);
            out.push({ name: 'analises-qualitativas-ps.csv', localFile: tmp.path });
        }

        if (riscoRows.length) {
            const tmp = ctx.getTmpFile('analises-de-risco-ps.csv');
            const opts: CsvWriterOptions<PSRiscoCsv> = {
                csvOptions: DefaultCsvOptions,
                transforms: DefaultTransforms,
                fields: schemaRisco.colunas.map((c) => c.name),
            };
            await WriteCsvToFile(riscoRows, tmp.stream, opts);
            out.push({ name: 'analises-de-risco-ps.csv', localFile: tmp.path });
        }

        if (fechamentoRows.length) {
            const tmp = ctx.getTmpFile('fechamentos-ps.csv');
            const opts: CsvWriterOptions<PSFechamentoCsv> = {
                csvOptions: DefaultCsvOptions,
                transforms: DefaultTransforms,
                fields: schemaFechamento.colunas.map((c) => c.name),
            };
            await WriteCsvToFile(fechamentoRows, tmp.stream, opts);
            out.push({ name: 'fechamentos-ps.csv', localFile: tmp.path });
        }

        // `indicadores.csv` e `regioes.csv`. O schema deles é declarado no `describeSchema`
        // acima, com estes mesmos params — é o que faz o pós-processamento formatá-los junto
        // com os cinco arquivos daqui.
        const indicadores = await this.indicadoresService.toFileOutput(this.paramsIndicadores(params), ctx, user);
        for (const indicador of indicadores) {
            out.push(indicador);
        }
        return out;
    }

    getClassFileName(): string {
        return Path2FileName(__filename);
    }
}
