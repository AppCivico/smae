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
    RelPsMonitoramentoMensalFasesCsvRow,
    RelPsMonitoramentoMensalVariaveisCsvRow,
} from './entities/ps-monitoramento-mensal-csv.entity';
import {
    RelPSMonitoramentoMensalCicloMetasDto,
    RelPsMonitoramentoMensalVariaveis,
    RelPsMonitRetorno,
} from './entities/ps-monitoramento-mensal.entity';

import { CsvWriterOptions, WriteCsvToFile } from 'src/common/helpers/CsvWriter';
import { Date2YMD } from '../../common/date2ymd';
import { leMonitoramentoFases } from '../../pdm-ciclo/monitoramento-fase.leitura';
import { montaLinhasFasesCsv } from './monitoramento-fases-csv';

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
                            to_char(sv.data_valor, 'YYYY-MM-DD') as data_referencia,
                            vcv.titulo as valor_categorica,
                            round(sv.valor_nominal, v.casas_decimais) as valor_nominal,
                            sv.atualizado_em AS data_preenchimento,
                            to_char(sv.data_valor + periodicidade_intervalo(v.periodicidade), 'YYYY-MM-DD') as data_proximo_ciclo,
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

    private async buscaMetasCiclo(
        params: CreatePsMonitoramentoMensalFilterDto,
        user: PessoaFromJwt | null
    ): Promise<RelPSMonitoramentoMensalCicloMetasDto[]> {
        if (!params.plano_setorial_id) params.plano_setorial_id = undefined;
        if (!params.pdm_id) params.pdm_id = undefined;

        const pdmId = params.pdm_id ?? params.plano_setorial_id;
        if (!pdmId) throw new BadRequestException('Informe o parâmetro pdm_id');

        const { metas } = await this.utils.applyFilter(
            { ...params, pdm_id: pdmId },
            { iniciativas: false, atividades: false },
            user
        );
        const metasArr = metas.map((r) => r.id);
        if (metasArr.length > 10000)
            throw new BadRequestException('Mais de 10000 indicadores encontrados, por favor refine a busca.');
        if (!metasArr.length) return [];

        const ciclo = await this.prisma.cicloFisico.findFirst({
            where: { pdm_id: pdmId, data_ciclo: new Date(Date.UTC(params.ano, params.mes - 1, 1)) },
            select: { id: true, data_ciclo: true },
        });
        if (!ciclo) return [];

        const metasDb = await this.prisma.meta.findMany({
            where: { id: { in: metasArr }, pdm_id: pdmId, removido_em: null },
            select: { id: true, codigo: true, titulo: true },
            orderBy: [{ codigo: 'asc' }, { id: 'asc' }],
        });
        const fasesPorMeta = await leMonitoramentoFases(
            this.prisma,
            pdmId,
            ciclo.id,
            metasDb.map((m) => m.id)
        );
        const data_ciclo = Date2YMD.toString(ciclo.data_ciclo);

        return metasDb.map((meta) => {
            const monitoramento = fasesPorMeta.get(meta.id);
            return {
                meta_id: meta.id,
                meta_codigo: meta.codigo,
                meta_titulo: meta.titulo,
                ciclo_fisico_id: ciclo.id,
                data_ciclo,
                ciclo_fechado: monitoramento?.ciclo_fechado ?? false,
                ciclo_reaberto: monitoramento?.ciclo_reaberto ?? false,
                fases: monitoramento?.fases ?? [],
            };
        });
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
     * Os arquivos próprios são condicionais (só saem quando há linhas); o `aplicarModelo` casa
     * schema com arquivo pelo nome e ignora os schemas cujo arquivo não foi produzido.
     *
     * No fim vêm os schemas do `IndicadoresService`, porque `toFileOutput` anexa os arquivos
     * dele (`indicadores.csv` e `regioes.csv`); sem eles o pós-processamento os repassaria crus.
     * O `isSchemaAware` é teste em runtime para não acoplar às classes de linha daquele serviço.
     */
    async describeSchema(params: CreatePsMonitoramentoMensalFilterDto): Promise<ReportFileSchema[]> {
        const doIndicador = isSchemaAware(this.indicadoresService)
            ? await this.indicadoresService.describeSchema(this.paramsIndicadores(params))
            : [];

        return [
            getReportRowSchema(RelPsMonitoramentoMensalVariaveisCsvRow),
            getReportRowSchema(RelPsMonitoramentoMensalFasesCsvRow),
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

        // Depois do `fetch`: ele valida `pdm_id`/`plano_setorial_id` e o `describeSchema` consulta o PDM.
        const [schemaVariaveis, schemaFases] = await this.describeSchema(params);

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
        const fasesRows = montaLinhasFasesCsv(cicloMetasRows);
        ctx.resumoSaida('Monitoramento Mensal Fases PS', fasesRows.length);

        if (fasesRows.length) {
            const tmp = ctx.getTmpFile('monitoramento-mensal-fases-ps.csv');
            const opts: CsvWriterOptions<RelPsMonitoramentoMensalFasesCsvRow> = {
                csvOptions: DefaultCsvOptions,
                transforms: DefaultTransforms,
                fields: schemaFases.colunas.map((c) => c.name),
            };
            await WriteCsvToFile(fasesRows, tmp.stream, opts);
            out.push({ name: 'monitoramento-mensal-fases-ps.csv', localFile: tmp.path });
        }

        // `indicadores.csv` e `regioes.csv`, cujo schema é declarado no `describeSchema` com os mesmos params
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
