import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Parser } from '@json2csv/plainjs';
import { flatten, Transform } from '@json2csv/transforms';
import { Prisma, Regiao } from '@prisma/client';
import { createWriteStream } from 'fs';
import { DateTime } from 'luxon';
import { Readable } from 'stream';

import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { EmitErrorAndDestroyStream, Stream2PromiseIntoArray } from '../../common/helpers/Streaming';
import { PrismaService } from '../../prisma/prisma.service';
import { RegiaoBasica as RegiaoDto } from '../../regiao/entities/regiao.entity';
import { getReportRowSchema } from '../post-process/report-column.decorator';
import { ReportColumnDef, ReportFileSchema, SchemaAwareReportableService } from '../post-process/report-schema';
import { ReportContext } from '../relatorios/helpers/reports.contexto';
import { DefaultCsvOptions, FileOutput, Path2FileName, ReportableService, UtilsService } from '../utils/utils.service';
import { CreateRelIndicadorDto, CreateRelIndicadorRegioesDto } from './dto/create-indicadores.dto';
import {
    RelIndicadoresCsvRow,
    RelIndicadoresRegioesCsvRow,
    rotulosPdmIndicadores,
} from './entities/indicadores-csv.entity';
import { ListIndicadoresDto, RelIndicadoresDto, RelIndicadoresVariaveisDto } from './entities/indicadores.entity';

const BATCH_SIZE = 500;
const CREATE_TEMP_TABLE = 'CREATE TEMP TABLE _report_data ON COMMIT DROP AS';

type CategoricaValorJson = {
    id: number;
    titulo: string;
    valor_variavel: number;
    quantidade?: number;
    variavel_id?: number;
};

type JsonRetornoDbIndicador = {
    valor_nominal: string;
    atualizado_em: Date;
    eh_previa: boolean;
    valores_categorica: CategoricaValorJson[] | null;
};

class RetornoDb {
    pdm_nome: string;
    data: string;
    data_referencia: string;
    valor: string | null;
    serie: string;

    indicador_id: number;
    indicador_codigo: string;
    indicador_titulo: string;
    indicador_contexto: string;
    indicador_complemento: string;
    indicador_tipo: string;

    variavel_id?: number;
    variavel_codigo?: string;
    variavel_titulo?: string;

    meta_id: number;
    meta_codigo: string;
    meta_titulo: string;

    meta_tags: { id: number; descricao: string; ods_id: number | null }[] | null;

    iniciativa_id: number;
    iniciativa_codigo: string;
    iniciativa_titulo: string;

    atividade_id: number;
    atividade_codigo: string;
    atividade_titulo: string;

    orgao_id: number;
    orgao_sigla: string;
    valor_categorica: string | null;
    eh_previa: boolean;
    valores_categorica: CategoricaValorJson[] | null;
}

class RetornoDbIndicadorJson extends RetornoDb {
    valor_json: JsonRetornoDbIndicador;
}

type JsonRetornoDbVariavel = {
    valor_nominal: string;
    atualizado_em: Date;
    valor_categorica: string | null;
    valores_categorica: CategoricaValorJson[] | null;
};

class RetornoDbRegiao extends RetornoDb {
    valor_json: JsonRetornoDbVariavel;
    regiao_id: number;
}

@Injectable()
export class IndicadoresService implements ReportableService, SchemaAwareReportableService {
    private readonly logger = new Logger(IndicadoresService.name);
    private invalidatePreparedStatement: number = 0;

    constructor(
        private readonly prisma: PrismaService,
        private readonly utils: UtilsService
    ) {}

    async asJSON(dto: CreateRelIndicadorDto, user: PessoaFromJwt | null): Promise<ListIndicadoresDto> {
        const indicadores = await this.filtraIndicadores(dto, user);

        if (indicadores.length >= 10000)
            throw new HttpException(
                `Mais de 10000 indicadores encontrados, por favor, refine sua busca ou utilize os endpoints streaming.`,
                400
            );

        const out: RelIndicadoresDto[] = [];
        const out_regioes: RelIndicadoresVariaveisDto[] = [];

        const linhasDataStream = new Readable({ objectMode: true, read() {} });

        await Promise.all([
            this.queryData(
                indicadores.map((r) => r.id),
                dto,
                linhasDataStream
            ),
            Stream2PromiseIntoArray(linhasDataStream, out),
        ]);

        const regioesDataStream = new Readable({ objectMode: true, read() {} });

        await Promise.all([
            this.queryDataRegiao(
                indicadores.map((r) => r.id),
                dto,
                regioesDataStream
            ),
            Stream2PromiseIntoArray(regioesDataStream, out_regioes),
        ]);

        return {
            linhas: out,
            regioes: out_regioes,
        };
    }

    streamLinhas(dto: CreateRelIndicadorDto, user: PessoaFromJwt | null): Readable {
        const stream = new Readable({ objectMode: true, read() {} });

        this.filtraIndicadores(dto, user)
            .then((indicadores) => {
                this.queryData(
                    indicadores.map((r) => r.id),
                    dto,
                    stream
                ).catch(EmitErrorAndDestroyStream(stream));
            })
            .catch(EmitErrorAndDestroyStream(stream));

        return stream;
    }

    streamRegioes(dto: CreateRelIndicadorRegioesDto, user: PessoaFromJwt | null): Readable {
        const stream = new Readable({ objectMode: true, read() {} });

        this.filtraIndicadores(dto, user)
            .then((indicadores) => {
                this.queryDataRegiao(
                    indicadores.map((r) => r.id),
                    dto,
                    stream
                ).catch(EmitErrorAndDestroyStream(stream));
            })
            .catch(EmitErrorAndDestroyStream(stream));

        return stream;
    }

    private async filtraIndicadores(dto: CreateRelIndicadorDto, user: PessoaFromJwt | null) {
        if (dto.periodo == 'Semestral' && !dto.semestre) {
            throw new HttpException('Necessário enviar semestre para o periodo Semestral', 400);
        }
        const { metas, iniciativas, atividades } = await this.utils.applyFilter(
            dto,
            {
                iniciativas: true,
                atividades: true,
            },
            user
        );

        const indicadores = await this.prisma.indicador.findMany({
            where: {
                removido_em: null,
                OR: [
                    { meta_id: { in: metas.map((r) => r.id) } },
                    { iniciativa_id: { in: iniciativas.map((r) => r.id) } },
                    { atividade_id: { in: atividades.map((r) => r.id) } },
                ],
            },
            select: { id: true },
        });

        return indicadores;
    }

    private async queryData(indicadoresOrVar: number[], dto: CreateRelIndicadorDto, stream: Readable) {
        //Tratamento para não ficar travado
        if (indicadoresOrVar.length == 0) {
            stream.push(null);
            return;
        }
        this.invalidatePreparedStatement++;

        const queryFromWhere = `indicador i ON i.id IN (${indicadoresOrVar.join(',')})
        left join meta on meta.id = i.meta_id
        left join iniciativa on iniciativa.id = i.iniciativa_id
        left join atividade on atividade.id = i.atividade_id
        left join iniciativa i2 on i2.id = atividade.iniciativa_id
        left join meta m2 on m2.id = iniciativa.meta_id OR m2.id = i2.meta_id
        left join pdm on pdm.id = meta.pdm_id or pdm.id = m2.pdm_id
        `;

        const anoInicial = await this.capturaAnoSerieIndicadorInicial(dto, queryFromWhere);

        // Updated SQL to use JSON function for indicator values
        const sql = `${CREATE_TEMP_TABLE} SELECT
        pdm.nome as pdm_nome,
        i.id as indicador_id,
        i.codigo as indicador_codigo,
        i.titulo as indicador_titulo,
        i.indicador_tipo as indicador_tipo,
        COALESCE(i.meta_id, m2.id) as meta_id,
        COALESCE(meta.titulo, m2.titulo) as meta_titulo,
        COALESCE(meta.codigo, m2.codigo) as meta_codigo,
        meta_tags_as_array(COALESCE(meta.id, m2.id)) as meta_tags,
        COALESCE(i.iniciativa_id, i2.id) as iniciativa_id,
        COALESCE(iniciativa.titulo, i2.titulo) as iniciativa_titulo,
        COALESCE(iniciativa.codigo, i2.codigo) as iniciativa_codigo,
        i.atividade_id,
        atividade.titulo as atividade_titulo,
        atividade.codigo as atividade_codigo,
        i.complemento as indicador_complemento,
        i.contexto as indicador_contexto,
        :DATA: as "data",
        dt.dt::date::text as "data_referencia",
        series.serie,
        valor_indicador_em_json(
            i.id,
            series.serie,
            dt.dt::date,
            :JANELA:
        ) AS valor_json
        from generate_series($1::date, $2::date, $3::interval) dt
        cross join (select 'Realizado'::"Serie" as serie UNION ALL select 'RealizadoAcumulado'::"Serie" as serie ) series
        join ${queryFromWhere}
        where dt.dt >= i.inicio_medicao AND dt.dt < i.fim_medicao + (select periodicidade_intervalo(i.periodicidade))
        AND NOT (i.indicador_tipo = 'Categorica' AND series.serie = 'RealizadoAcumulado')
        `;

        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                if (dto.tipo == 'Mensal' && dto.mes) {
                    await this.rodaQueryMensalAnalitico(prismaTxn, sql, dto.ano, dto.mes);
                    await this.streamRowsIntoIndicador(stream, prismaTxn);
                } else if (dto.periodo == 'Anual' && dto.tipo == 'Analitico') {
                    await this.rodaQueryAnualAnalitico(prismaTxn, sql, anoInicial);

                    for (let ano = anoInicial + 1; ano <= dto.ano; ano++) {
                        await this.rodaQueryAnualAnalitico(prismaTxn, this.replaceCreateToInsert(sql), ano);
                    }

                    await this.streamRowsIntoIndicador(stream, prismaTxn);
                } else if (dto.periodo == 'Anual' && dto.tipo == 'Consolidado') {
                    await this.rodaQueryAnualConsolidado(prismaTxn, sql, dto.ano);

                    await this.streamRowsIntoIndicador(stream, prismaTxn);
                } else if (dto.periodo == 'Semestral' && dto.tipo == 'Consolidado') {
                    const tipo = dto.semestre == 'Primeiro' ? 'Primeiro' : 'Segundo';
                    const ano = dto.ano;

                    await this.rodaQuerySemestralConsolidado(tipo, ano, prismaTxn, sql);

                    await this.streamRowsIntoIndicador(stream, prismaTxn);
                } else if (dto.periodo == 'Semestral' && dto.tipo == 'Analitico') {
                    const tipo = dto.semestre == 'Primeiro' ? 'Primeiro' : 'Segundo';
                    const ano = anoInicial;

                    const semestreInicio = tipo === 'Segundo' ? ano + '-12-01' : ano + '-06-01';

                    await this.rodaQuerySemestralAnalitico(prismaTxn, sql, semestreInicio, tipo);

                    for (let ano = anoInicial + 1; ano <= dto.ano; ano++) {
                        const semestreInicio = tipo === 'Segundo' ? ano + '-12-01' : ano + '-06-01';

                        await this.rodaQuerySemestralAnalitico(
                            prismaTxn,
                            this.replaceCreateToInsert(sql),
                            semestreInicio,
                            tipo
                        );
                    }

                    await this.streamRowsIntoIndicador(stream, prismaTxn);
                }
            },
            {
                maxWait: 1000000,
                timeout: 60 * 1000 * 15,
                isolationLevel: 'Serializable',
            }
        );
    }

    private async rodaQuerySemestralAnalitico(
        prismaTxn: Prisma.TransactionClient,
        sql: string,
        semestreInicio: string,
        tipo: string
    ) {
        await prismaTxn.$queryRawUnsafe(
            sql
                .replace(':JANELA:', '6')
                .replace(':DATA:', "(dt.dt::date - '5 months'::interval)::date::text || '/' || (dt.dt::date)"),
            DateTime.fromISO(semestreInicio)
                .minus({ months: tipo === 'Segundo' ? 11 : 5 })
                .toISODate(),
            semestreInicio,
            '1 month'
        );
    }

    private async rodaQuerySemestralConsolidado(
        tipo: string,
        ano: number,
        prismaTxn: Prisma.TransactionClient,
        sql: string
    ) {
        if (tipo == 'Segundo') {
            await this.rodaQuerySemestreConsolidado('Primeiro', ano, prismaTxn, sql);
            await this.rodaQuerySemestreConsolidado(tipo, ano, prismaTxn, this.replaceCreateToInsert(sql));
        } else {
            await this.rodaQuerySemestreConsolidado('Primeiro', ano, prismaTxn, sql);
        }
    }

    private replaceCreateToInsert(sql: string): string {
        return sql.replace(CREATE_TEMP_TABLE, 'INSERT INTO _report_data');
    }

    private async rodaQueryAnualConsolidado(prismaTxn: Prisma.TransactionClient, sql: string, ano: number) {
        await prismaTxn.$queryRawUnsafe(
            sql
                .replace(':JANELA:', '12')
                .replace(':DATA:', "(dt.dt::date - '11 months'::interval)::date::text || '/' || (dt.dt::date)"),
            ano + '-12-01',
            ano + '-12-01',
            '1 year'
        );
    }

    private async capturaAnoSerieIndicadorInicial(dto: CreateRelIndicadorDto, queryFromWhere: string) {
        if (dto.analitico_desde_o_inicio !== false && dto.tipo == 'Analitico') {
            const buscaInicio: { min: Date }[] = await this.prisma.$queryRawUnsafe(`SELECT min(si.data_valor::date)
            FROM (select 'Realizado'::"Serie" as serie UNION ALL select 'RealizadoAcumulado'::"Serie" as serie ) series
            JOIN serie_indicador si ON si.serie = series.serie
            JOIN ${queryFromWhere} and si.indicador_id = i.id`);

            if (buscaInicio.length && buscaInicio[0].min) return buscaInicio[0].min.getFullYear();
        }

        return dto.ano;
    }

    private async capturaAnoSerieVariavelInicial(dto: CreateRelIndicadorDto, queryFromWhere: string) {
        if (dto.analitico_desde_o_inicio !== false) {
            const buscaInicio: { min: Date }[] = await this.prisma.$queryRawUnsafe(`SELECT min(sv.data_valor::date)
        FROM (select 'Realizado'::"Serie" as serie UNION ALL select 'RealizadoAcumulado'::"Serie" as serie ) series
        JOIN serie_variavel sv ON sv.serie = series.serie
        JOIN ${queryFromWhere} and sv.variavel_id = v.id`);

            if (buscaInicio.length && buscaInicio[0].min) return buscaInicio[0].min.getFullYear();
        }

        return dto.ano;
    }

    private async rodaQueryAnualAnalitico(prismaTxn: Prisma.TransactionClient, sql: string, ano: number | undefined) {
        await prismaTxn.$queryRawUnsafe(
            sql
                .replace(':JANELA:', "extract('month' from periodicidade_intervalo(i.periodicidade))::int")
                .replace(':DATA:', 'dt.dt::date::text'),
            ano + '-01-01',
            ano + '-12-01',
            '1 month'
        );
    }

    private async rodaQueryMensalAnalitico(prismaTxn: Prisma.TransactionClient, sql: string, ano: number, mes: number) {
        await prismaTxn.$queryRawUnsafe(
            sql
                .replace(':JANELA:', "extract('month' from periodicidade_intervalo(i.periodicidade))::int")
                .replace(':DATA:', 'dt.dt::date::text'),
            ano + '-' + mes + '-01',
            ano + '-' + mes + '-01',
            '1 month'
        );
    }

    private async rodaQuerySemestreConsolidado(
        tipo: string,
        ano: number,
        prismaTxn: Prisma.TransactionClient,
        sql: string
    ) {
        const dataAno = tipo == 'Primeiro' ? ano + '-06-01' : ano + '-12-01';

        await prismaTxn.$queryRawUnsafe(
            sql
                .replace(':JANELA:', '6')
                .replace(':DATA:', "(dt.dt::date - '5 months'::interval)::date::text || '/' || (dt.dt::date)"),
            dataAno,
            dataAno,
            '1 second'
        );
        return dataAno;
    }

    private async queryDataRegiao(indicadoresOrVar: number[], dto: CreateRelIndicadorRegioesDto, stream: Readable) {
        if (indicadoresOrVar.length == 0) {
            stream.push(null);
            return;
        }
        this.logger.log('Querying data for regioes');
        this.invalidatePreparedStatement++;

        let queryFromWhere = `indicador i ON i.id IN (${indicadoresOrVar.join(',')})
        join indicador_variavel iv ON iv.indicador_id = i.id
        join variavel v ON v.id = iv.variavel_id
        join orgao ON v.orgao_id = orgao.id
        left join meta on meta.id = i.meta_id
        left join iniciativa on iniciativa.id = i.iniciativa_id
        left join atividade on atividade.id = i.atividade_id
        left join iniciativa i2 on i2.id = atividade.iniciativa_id
        left join meta m2 on m2.id = iniciativa.meta_id OR m2.id = i2.meta_id
        left join pdm on pdm.id = meta.pdm_id or pdm.id = m2.pdm_id
        where v.regiao_id is not null`;

        if (Array.isArray(dto.regioes)) {
            const numbers = dto.regioes.map((n) => +n).join(',');
            queryFromWhere = `${queryFromWhere} AND v.regiao_id IN (${numbers})`;
        }

        const anoInicial = await this.capturaAnoSerieVariavelInicial(dto, queryFromWhere);

        const sql = `${CREATE_TEMP_TABLE} SELECT
        pdm.nome as pdm_nome,
        i.id as indicador_id,
        i.codigo as indicador_codigo,
        i.titulo as indicador_titulo,
        i.indicador_tipo as indicador_tipo,
        COALESCE(i.meta_id, m2.id) as meta_id,
        COALESCE(meta.titulo, m2.titulo) as meta_titulo,
        COALESCE(meta.codigo, m2.codigo) as meta_codigo,
        meta_tags_as_array(COALESCE(meta.id, m2.id)) as meta_tags,
        COALESCE(i.iniciativa_id, i2.id) as iniciativa_id,
        COALESCE(iniciativa.titulo, i2.titulo) as iniciativa_titulo,
        COALESCE(iniciativa.codigo, i2.codigo) as iniciativa_codigo,
        i.atividade_id,
        atividade.titulo as atividade_titulo,
        atividade.codigo as atividade_codigo,
        :DATA: as "data",
        dt.dt::date::text as "data_referencia",
        series.serie,
        v.id as variavel_id,
        v.codigo as variavel_codigo,
        v.titulo as variavel_titulo,
        v.regiao_id as regiao_id,
        orgao.id as orgao_id,
        orgao.sigla as orgao_sigla,
        valor_variavel_em_json(
            v.id,
            series.serie,
            dt.dt::date,
            :JANELA:
        ) AS valor_json
        from generate_series($1::date, $2::date, $3::interval) dt
        cross join (select 'Realizado'::"Serie" as serie UNION ALL select 'RealizadoAcumulado'::"Serie" as serie ) series
        join ${queryFromWhere}
        AND dt.dt >= i.inicio_medicao AND dt.dt < i.fim_medicao + (select periodicidade_intervalo(i.periodicidade))
        AND NOT (i.indicador_tipo = 'Categorica' AND series.serie = 'RealizadoAcumulado')
        `;

        const regioes = await this.prisma.regiao.findMany({
            where: { removido_em: null },
        });
        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                if (dto.tipo == 'Mensal' && dto.mes) {
                    await this.rodaQueryMensalAnalitico(prismaTxn, sql, dto.ano, dto.mes);
                    await this.streamRowsIntoRegiao(regioes, stream, prismaTxn);
                } else if (dto.periodo == 'Anual' && dto.tipo == 'Analitico') {
                    await this.rodaQueryAnualAnalitico(prismaTxn, sql, anoInicial);

                    for (let ano = anoInicial + 1; ano <= dto.ano; ano++) {
                        await this.rodaQueryAnualAnalitico(prismaTxn, this.replaceCreateToInsert(sql), ano);
                    }

                    await this.streamRowsIntoRegiao(regioes, stream, prismaTxn);
                } else if (dto.periodo == 'Anual' && dto.tipo == 'Consolidado') {
                    await this.rodaQueryAnualConsolidado(prismaTxn, sql, dto.ano);

                    await this.streamRowsIntoRegiao(regioes, stream, prismaTxn);
                } else if (dto.periodo == 'Semestral' && dto.tipo == 'Consolidado') {
                    const tipo = dto.semestre == 'Primeiro' ? 'Primeiro' : 'Segundo';
                    const ano = dto.ano;

                    await this.rodaQuerySemestralConsolidado(tipo, ano, prismaTxn, sql);

                    await this.streamRowsIntoRegiao(regioes, stream, prismaTxn);
                } else if (dto.periodo == 'Semestral' && dto.tipo == 'Analitico') {
                    const tipo = dto.semestre == 'Primeiro' ? 'Primeiro' : 'Segundo';
                    const ano = anoInicial;

                    const semestreInicio = tipo === 'Segundo' ? ano + '-12-01' : ano + '-06-01';

                    await this.rodaQuerySemestralAnalitico(prismaTxn, sql, semestreInicio, tipo);

                    for (let ano = anoInicial + 1; ano <= dto.ano; ano++) {
                        const semestreInicio = tipo === 'Segundo' ? ano + '-12-01' : ano + '-06-01';

                        await this.rodaQuerySemestralAnalitico(
                            prismaTxn,
                            this.replaceCreateToInsert(sql),
                            semestreInicio,
                            tipo
                        );
                    }

                    await this.streamRowsIntoRegiao(regioes, stream, prismaTxn);
                }
            },
            {
                maxWait: 1000000,
                timeout: 60 * 1000 * 15,
                isolationLevel: 'Serializable',
            }
        );
    }

    /**
     * Parser de lote do CSV **bruto**.
     *
     * `fields` são os nomes de máquina do schema — o cabeçalho humano volta no
     * pós-processamento. O `flatten` usa `__` em vez do `.` padrão porque o builder DuckDB
     * interpreta ponto como referência qualificada por fonte; `arrays: false` é o default e
     * é o que mantém o conjunto de colunas fixo (um array vira uma célula, não N colunas).
     */
    private createCsvParser(colunas: ReportColumnDef[]): Parser<any, any> {
        return new Parser({
            fields: colunas.map((c) => c.name),
            header: false,
            ...DefaultCsvOptions,
            transforms: [flatten({ objects: true, arrays: false, separator: '__' })] satisfies [
                Transform<any, any>,
                ...Transform<any, any>[],
            ],
        });
    }

    /** Cabeçalho do CSV bruto: nomes de máquina do schema, na ordem do schema. */
    private writeCsvHeader(fileStream: ReturnType<typeof createWriteStream>, colunas: ReportColumnDef[]) {
        const header = colunas.map((c) => '"' + c.name + '"').join(',');
        fileStream.write(header + '\r\n');
    }

    private formatMetaTags(meta_tags: { id: number; descricao: string }[] | null | undefined): {
        descricao: string | null;
        ids: string | null;
    } {
        const arr = meta_tags && Array.isArray(meta_tags) ? meta_tags : [];
        // Meta sem tag vira `null` e não `''`: no CSV bruto ausência de valor precisa chegar
        // NULL ao DuckDB, senão o filtro "está vazio" do modelo não casaria com essas linhas.
        if (arr.length == 0) return { descricao: null, ids: null };

        return {
            descricao: arr.map((t) => t.descricao).join(';'),
            ids: arr.map((t) => t.id).join(';'),
        };
    }

    private buildBaseRow(row: RetornoDb) {
        const { descricao: metaTagsDescricao, ids: metaTagsIds } = this.formatMetaTags(row.meta_tags);

        return {
            pdm_nome: row.pdm_nome,
            indicador: {
                codigo: row.indicador_codigo,
                titulo: row.indicador_titulo,
                contexto: row.indicador_contexto,
                complemento: row.indicador_complemento,
                id: +row.indicador_id,
            },
            meta: row.meta_id ? { codigo: row.meta_codigo, titulo: row.meta_titulo, id: +row.meta_id } : null,
            meta_tags_descricao: metaTagsDescricao,
            meta_tags_ids: metaTagsIds,
            iniciativa: row.iniciativa_id
                ? { codigo: row.iniciativa_codigo, titulo: row.iniciativa_titulo, id: +row.iniciativa_id }
                : null,
            atividade: row.atividade_id
                ? { codigo: row.atividade_codigo, titulo: row.atividade_titulo, id: +row.atividade_id }
                : null,
        };
    }

    /**
     * Schema dos CSVs brutos — habilita o pós-processamento (rótulos, formatação pt-BR,
     * seleção/filtro/ordenação de colunas e XLSX tipado).
     *
     * Devolve `indicadores.csv` e `regioes.csv` na mesma ordem em que `toFileOutput` os
     * emite. Os dois arquivos sempre são descritos, mesmo quando um deles acaba sem linhas
     * e não é entregue: o pós-processamento casa schema com arquivo pelo nome.
     *
     * Duas coisas dependem dos parâmetros/do PDM e por isso são resolvidas aqui, e não nos
     * decoradores:
     *
     *   - `pdm_nome` só existe na variante Plano Setorial (`tipo_pdm == 'PS'`); no PDM
     *     antigo a coluna é recortada do schema, reproduzindo o `if` que o
     *     `buildBaseCsvFields()` fazia;
     *   - os rótulos de iniciativa/atividade/contexto/complementação vêm do PDM.
     *
     * `tipo` e `periodo` **não** entram: eles mudam a janela da consulta e o conteúdo da
     * coluna `data`, nunca o conjunto de colunas.
     */
    async describeSchema(params: CreateRelIndicadorDto): Promise<ReportFileSchema[]> {
        const pdm = await this.buscaRotulosDoPdm(params);

        return [
            this.aplicaVarianteDoPdm(getReportRowSchema(RelIndicadoresCsvRow), pdm, params),
            this.aplicaVarianteDoPdm(getReportRowSchema(RelIndicadoresRegioesCsvRow), pdm, params),
        ];
    }

    private async buscaRotulosDoPdm(params: CreateRelIndicadorDto) {
        return await this.prisma.pdm.findUniqueOrThrow({
            where: { id: params.pdm_id },
            select: {
                rotulo_iniciativa: true,
                rotulo_atividade: true,
                rotulo_contexto_meta: true,
                rotulo_complementacao_meta: true,
            },
        });
    }

    private aplicaVarianteDoPdm(
        schema: ReportFileSchema,
        pdm: Parameters<typeof rotulosPdmIndicadores>[0],
        params: CreateRelIndicadorDto
    ): ReportFileSchema {
        const rotulos = rotulosPdmIndicadores(pdm);

        return {
            ...schema,
            colunas: schema.colunas
                .filter((c) => c.name !== 'pdm_nome' || params.tipo_pdm == 'PS')
                .map((c) => (rotulos[c.name] ? { ...c, label: rotulos[c.name]! } : c)),
        };
    }

    async toFileOutput(
        params: CreateRelIndicadorDto,
        ctx: ReportContext,
        user: PessoaFromJwt | null
    ): Promise<FileOutput[]> {
        if (params.tipo == 'Mensal' && !params.mes)
            throw new HttpException('Necessário enviar mês para o periodo Mensal', 400);
        if (params.periodo == 'Mensal' && params.tipo !== 'Geral')
            throw new HttpException('Necessário enviar tipo Geral para o periodo Mensal', 400);

        this.logger.verbose(`Gerando arquivos CSV para ${JSON.stringify(params)}`);
        const indicadores = await this.filtraIndicadores(params, user);
        this.logger.verbose(`Indicadores encontrados: ${indicadores.length}`);

        await ctx.progress(1);

        // CSV bruto: cabeçalho com os nomes de máquina das colunas do schema, valores crus e
        // nenhuma lambda de formatação. Rótulos (inclusive os do PDM), separador decimal pt-BR
        // e `dd/mm/aaaa` vêm do schema, aplicados no pós-processamento.
        const [schemaIndicador, schemaRegiao] = await this.describeSchema(params);
        const out: FileOutput[] = [];

        const tmpIndic = ctx.getTmpFile('indicadores.csv');
        const tmpRegio = ctx.getTmpFile('regioes.csv');

        try {
            const indicadorParser = this.createCsvParser(schemaIndicador.colunas);

            const indicadoresCount = await this.processDadosIndicadores(
                indicadores,
                params,
                schemaIndicador.colunas,
                indicadorParser,
                tmpIndic.path
            );
            await ctx.resumoSaida('Indicadores', indicadoresCount);

            if (indicadoresCount > 0) {
                this.logger.debug(`CSV de indicadores gerado: ${tmpIndic.path}`);
                out.push({
                    name: 'indicadores.csv',
                    localFile: tmpIndic.path,
                });
            }

            await ctx.progress(50);

            const regiaoParser = this.createCsvParser(schemaRegiao.colunas);

            const regioesCount = await this.processDadosRegioes(
                indicadores,
                params as CreateRelIndicadorRegioesDto,
                schemaRegiao.colunas,
                regiaoParser,
                tmpRegio.path
            );
            await ctx.resumoSaida('Indicadores Regionalizados', regioesCount);

            if (regioesCount > 0) {
                this.logger.debug(`CSV de regiões gerado: ${tmpRegio.path}`);
                out.push({
                    name: 'regioes.csv',
                    localFile: tmpRegio.path,
                });
            }
        } catch (error) {
            this.logger.error(`Erro ao processar: ${error}`);
            throw error;
        }

        this.logger.debug(`CSVs gerados`);
        await ctx.progress(99);

        return out;
    }

    private async processDadosIndicadores(
        indicadores: { id: number }[],
        params: CreateRelIndicadorDto,
        csvColunas: ReportColumnDef[],
        parser: Parser<any, any>,
        filePath: string
    ): Promise<number> {
        let total = 0;
        // Create file stream
        const fileStream = createWriteStream(filePath);

        // Write header
        this.writeCsvHeader(fileStream, csvColunas);

        // Base query structure - updated to use JSON function
        const queryBase = `
        SELECT
            pdm.nome as pdm_nome,
            i.id as indicador_id,
            i.codigo as indicador_codigo,
            i.titulo as indicador_titulo,
            i.indicador_tipo as indicador_tipo,
            COALESCE(i.meta_id, m2.id) as meta_id,
            COALESCE(meta.titulo, m2.titulo) as meta_titulo,
            COALESCE(meta.codigo, m2.codigo) as meta_codigo,
            meta_tags_as_array(COALESCE(meta.id, m2.id)) as meta_tags,
            COALESCE(i.iniciativa_id, i2.id) as iniciativa_id,
            COALESCE(iniciativa.titulo, i2.titulo) as iniciativa_titulo,
            COALESCE(iniciativa.codigo, i2.codigo) as iniciativa_codigo,
            i.atividade_id,
            atividade.titulo as atividade_titulo,
            atividade.codigo as atividade_codigo,
            i.complemento as indicador_complemento,
            i.contexto as indicador_contexto,
            ${this.getDataExpression(params)} as "data",
            dt.dt::date::text as "data_referencia",
            series.serie,
            valor_indicador_em_json(
                i.id,
                series.serie,
                dt.dt::date,
                ${this.getJanelaExpression(params)}
            ) AS valor_json
        FROM
            generate_series($1::date, $2::date, $3::interval) dt
        CROSS JOIN
            (select 'Realizado'::"Serie" as serie UNION ALL select 'RealizadoAcumulado'::"Serie" as serie ) series
        JOIN
            indicador i ON i.id IN (${indicadores.length ? indicadores.map((r) => r.id).join(',') : 0})
        LEFT JOIN
            meta ON meta.id = i.meta_id
        LEFT JOIN
            iniciativa ON iniciativa.id = i.iniciativa_id
        LEFT JOIN
            atividade ON atividade.id = i.atividade_id
        LEFT JOIN
            iniciativa i2 ON i2.id = atividade.iniciativa_id
        LEFT JOIN
            meta m2 ON m2.id = iniciativa.meta_id OR m2.id = i2.meta_id
        LEFT JOIN
            pdm ON pdm.id = meta.pdm_id OR pdm.id = m2.pdm_id
        WHERE
            dt.dt >= i.inicio_medicao AND dt.dt < i.fim_medicao + (select periodicidade_intervalo(i.periodicidade))
            AND NOT (i.indicador_tipo = 'Categorica' AND series.serie = 'RealizadoAcumulado')
        `;

        try {
            // Handle different query types
            if (params.tipo == 'Mensal' && params.mes) {
                // For Mensal, query a single month
                total += Number(
                    await this.executeSqlAndWriteToFileIndicador(queryBase, fileStream, parser, [
                        `${params.ano}-${params.mes}-01`,
                        `${params.ano}-${params.mes}-01`,
                        '1 month',
                    ])
                );
            } else if (params.periodo == 'Anual' && params.tipo == 'Analitico') {
                // For Anual Analitico, query all months in the year
                const anoInicial = await this.capturaAnoSerieIndicadorInicial(
                    params,
                    `indicador i ON i.id IN (${indicadores.length ? indicadores.map((r) => r.id).join(',') : 0})`
                );

                for (let ano = anoInicial; ano <= params.ano; ano++) {
                    total += Number(
                        await this.executeSqlAndWriteToFileIndicador(queryBase, fileStream, parser, [
                            `${ano}-01-01`,
                            `${ano}-12-01`,
                            '1 month',
                        ])
                    );
                }
            } else if (params.periodo == 'Anual' && params.tipo == 'Consolidado') {
                // For Anual Consolidado, query the whole year
                total += Number(
                    await this.executeSqlAndWriteToFileIndicador(queryBase, fileStream, parser, [
                        `${params.ano}-12-01`,
                        `${params.ano}-12-01`,
                        '1 year',
                    ])
                );
            } else if (params.periodo == 'Semestral' && params.tipo == 'Consolidado') {
                const tipo = params.semestre == 'Primeiro' ? 'Primeiro' : 'Segundo';
                const dataAno = tipo == 'Primeiro' ? params.ano + '-06-01' : params.ano + '-12-01';

                total += Number(
                    await this.executeSqlAndWriteToFileIndicador(queryBase, fileStream, parser, [
                        dataAno,
                        dataAno,
                        '1 second',
                    ])
                );
            } else if (params.periodo == 'Semestral' && params.tipo == 'Analitico') {
                const tipo = params.semestre == 'Primeiro' ? 'Primeiro' : 'Segundo';

                const anoInicial = await this.capturaAnoSerieIndicadorInicial(
                    params,
                    `indicador i ON i.id IN (${indicadores.length ? indicadores.map((r) => r.id).join(',') : 0})`
                );

                for (let ano = anoInicial; ano <= params.ano; ano++) {
                    const semestreInicio = tipo === 'Segundo' ? ano + '-12-01' : ano + '-06-01';
                    const semestreInicioData = DateTime.fromISO(semestreInicio)
                        .minus({ months: tipo === 'Segundo' ? 11 : 5 })
                        .toISODate();

                    total += Number(
                        await this.executeSqlAndWriteToFileIndicador(queryBase, fileStream, parser, [
                            semestreInicioData,
                            semestreInicio,
                            '1 month',
                        ])
                    );
                }
            }
        } finally {
            // Close file stream
            fileStream.end();
        }
        return total;
    }

    /**
     * Get data expression based on params
     */
    private getDataExpression(params: CreateRelIndicadorDto): string {
        if (params.periodo == 'Anual' && params.tipo == 'Consolidado') {
            return "(dt.dt::date - '11 months'::interval)::date::text || '/' || (dt.dt::date)";
        } else if (params.periodo == 'Semestral' && (params.tipo == 'Consolidado' || params.tipo == 'Analitico')) {
            return "(dt.dt::date - '5 months'::interval)::date::text || '/' || (dt.dt::date)";
        } else {
            return 'dt.dt::date::text';
        }
    }

    /**
     * Get janela expression based on params
     */
    private getJanelaExpression(params: CreateRelIndicadorDto): string {
        if (params.periodo == 'Anual' && params.tipo == 'Consolidado') {
            return '12';
        } else if (params.periodo == 'Semestral' && (params.tipo == 'Consolidado' || params.tipo == 'Analitico')) {
            return '6';
        } else {
            return "extract('month' from periodicidade_intervalo(i.periodicidade))::int";
        }
    }

    private async processDadosRegioes(
        indicadores: { id: number }[],
        params: CreateRelIndicadorRegioesDto,
        csvColunas: ReportColumnDef[],
        parser: Parser<any, any>,
        filePath: string
    ): Promise<number> {
        let total = 0;
        // Create file stream
        const fileStream = createWriteStream(filePath);

        // Write header
        this.writeCsvHeader(fileStream, csvColunas);

        try {
            // Get regioes first - needed for processing results
            const regioes = await this.prisma.regiao.findMany({
                where: { removido_em: null },
            });

            this.logger.debug(`Found ${regioes.length} regions for processing`);

            // Build WHERE clause for regions
            let regionWhere = '';
            if (Array.isArray(params.regioes) && params.regioes.length > 0) {
                const numbers = params.regioes.map((n) => +n).join(',');
                regionWhere = ` AND v.regiao_id IN (${numbers})`;
                this.logger.debug(`Filtering regions to: ${numbers}`);
            }

            // Build the anoInicial query first
            const queryFromWhere = `indicador i ON i.id IN (${indicadores.length ? indicadores.map((r) => r.id).join(',') : 0})
        join indicador_variavel iv ON iv.indicador_id = i.id
        join variavel v ON v.id = iv.variavel_id
        join orgao ON v.orgao_id = orgao.id
        left join meta on meta.id = i.meta_id
        left join iniciativa on iniciativa.id = i.iniciativa_id
        left join atividade on atividade.id = i.atividade_id
        left join iniciativa i2 on i2.id = atividade.iniciativa_id
        left join meta m2 on m2.id = iniciativa.meta_id OR m2.id = i2.meta_id
        left join pdm on pdm.id = meta.pdm_id or pdm.id = m2.pdm_id
        where v.regiao_id is not null${regionWhere}`;

            // Get the initial year if needed
            let anoInicial = params.ano;
            if (
                params.periodo === 'Anual' &&
                params.tipo === 'Analitico' &&
                params.analitico_desde_o_inicio !== false
            ) {
                try {
                    anoInicial = await this.capturaAnoSerieVariavelInicial(params, queryFromWhere);
                    this.logger.debug(`Starting year for regioes: ${anoInicial}`);
                } catch (error) {
                    this.logger.error(`Error getting initial year for regioes: ${error}`);
                    // Fall back to params.ano
                    anoInicial = params.ano;
                }
            }

            // Base query structure
            const queryBase = `
        SELECT
            pdm.nome as pdm_nome,
            i.id as indicador_id,
            i.codigo as indicador_codigo,
            i.titulo as indicador_titulo,
            COALESCE(i.meta_id, m2.id) as meta_id,
            COALESCE(meta.titulo, m2.titulo) as meta_titulo,
            COALESCE(meta.codigo, m2.codigo) as meta_codigo,
            meta_tags_as_array(COALESCE(meta.id, m2.id)) as meta_tags,
            COALESCE(i.iniciativa_id, i2.id) as iniciativa_id,
            COALESCE(iniciativa.titulo, i2.titulo) as iniciativa_titulo,
            COALESCE(iniciativa.codigo, i2.codigo) as iniciativa_codigo,
            i.atividade_id,
            atividade.titulo as atividade_titulo,
            atividade.codigo as atividade_codigo,
            -- Estas duas colunas estavam no cabeçalho de regioes.csv desde sempre, mas nunca
            -- eram selecionadas aqui: saíam vazias em toda linha. Com o schema declarado a
            -- coluna também vira filtro/ordenação no modelo de relatório, então uma coluna
            -- eternamente NULL deixa de ser só cosmética. A origem é a mesma usada em
            -- indicadores.csv (i.contexto / i.complemento), sem ambiguidade.
            i.complemento as indicador_complemento,
            i.contexto as indicador_contexto,
            ${this.getDataExpression(params)} as "data",
            dt.dt::date::text as "data_referencia",
            series.serie,
            v.id as variavel_id,
            v.codigo as variavel_codigo,
            v.titulo as variavel_titulo,
            v.regiao_id as regiao_id,
            orgao.id as orgao_id,
            orgao.sigla as orgao_sigla,
            valor_variavel_em_json(
                v.id,
                series.serie,
                dt.dt::date,
                ${this.getJanelaExpression(params)}
            ) AS valor_json
        FROM
            generate_series($1::date, $2::date, $3::interval) dt
        CROSS JOIN
            (select 'Realizado'::"Serie" as serie UNION ALL select 'RealizadoAcumulado'::"Serie" as serie) series
        JOIN
            indicador i ON i.id IN (${indicadores.length ? indicadores.map((r) => r.id).join(',') : 0})
        JOIN
            indicador_variavel iv ON iv.indicador_id = i.id
        JOIN
            variavel v ON v.id = iv.variavel_id
        JOIN
            orgao ON v.orgao_id = orgao.id
        LEFT JOIN
            meta ON meta.id = i.meta_id
        LEFT JOIN
            iniciativa ON iniciativa.id = i.iniciativa_id
        LEFT JOIN
            atividade ON atividade.id = i.atividade_id
        LEFT JOIN
            iniciativa i2 ON i2.id = atividade.iniciativa_id
        LEFT JOIN
            meta m2 ON m2.id = iniciativa.meta_id OR m2.id = i2.meta_id
        LEFT JOIN
            pdm ON pdm.id = meta.pdm_id OR pdm.id = m2.pdm_id
        WHERE
            v.regiao_id is not null
            ${regionWhere}
            AND dt.dt >= i.inicio_medicao AND dt.dt < i.fim_medicao + (select periodicidade_intervalo(i.periodicidade))
        `;

            // Log the query parameters for debugging
            this.logger.debug(
                `Processing regioes with params: ${JSON.stringify({
                    tipo: params.tipo,
                    periodo: params.periodo,
                    ano: params.ano,
                    mes: params.mes,
                    semestre: params.semestre,
                    anoInicial,
                })}`
            );

            // Handle different query types based on params
            if (params.tipo == 'Mensal' && params.mes) {
                this.logger.debug(`Executing Mensal query for regioes`);
                total += Number(
                    await this.executeSqlAndWriteToFileRegiao(queryBase, fileStream, regioes, parser, [
                        `${params.ano}-${params.mes}-01`,
                        `${params.ano}-${params.mes}-01`,
                        '1 month',
                    ])
                );
            } else if (params.periodo == 'Anual' && params.tipo == 'Analitico') {
                this.logger.debug(`Executing Anual Analitico query for regioes from ${anoInicial} to ${params.ano}`);

                for (let ano = anoInicial; ano <= params.ano; ano++) {
                    this.logger.debug(`Processing year ${ano} for regioes`);
                    total += Number(
                        await this.executeSqlAndWriteToFileRegiao(queryBase, fileStream, regioes, parser, [
                            `${ano}-01-01`,
                            `${ano}-12-01`,
                            '1 month',
                        ])
                    );
                }
            } else if (params.periodo == 'Anual' && params.tipo == 'Consolidado') {
                this.logger.debug(`Executing Anual Consolidado query for regioes`);
                total += Number(
                    await this.executeSqlAndWriteToFileRegiao(queryBase, fileStream, regioes, parser, [
                        `${params.ano}-12-01`,
                        `${params.ano}-12-01`,
                        '1 year',
                    ])
                );
            } else if (params.periodo == 'Semestral' && params.tipo == 'Consolidado') {
                const tipo = params.semestre == 'Primeiro' ? 'Primeiro' : 'Segundo';
                const dataAno = tipo == 'Primeiro' ? params.ano + '-06-01' : params.ano + '-12-01';

                this.logger.debug(`Executing Semestral Consolidado query for regioes: ${tipo} ${params.ano}`);
                total += Number(
                    await this.executeSqlAndWriteToFileRegiao(queryBase, fileStream, regioes, parser, [
                        dataAno,
                        dataAno,
                        '1 second',
                    ])
                );
            } else if (params.periodo == 'Semestral' && params.tipo == 'Analitico') {
                const tipo = params.semestre == 'Primeiro' ? 'Primeiro' : 'Segundo';

                for (let ano = anoInicial; ano <= params.ano; ano++) {
                    const semestreInicio = tipo === 'Segundo' ? ano + '-12-01' : ano + '-06-01';

                    this.logger.debug(`Executing Semestral Analitico query for regioes: ${tipo} ${ano}`);
                    total += Number(
                        await this.executeSqlAndWriteToFileRegiao(queryBase, fileStream, regioes, parser, [
                            DateTime.fromISO(semestreInicio)
                                .minus({ months: tipo === 'Segundo' ? 11 : 5 })
                                .toISODate(),
                            semestreInicio,
                            '1 month',
                        ])
                    );
                }
            } else {
                this.logger.warn(`No matching query type for regioes: ${params.periodo} ${params.tipo}`);
            }
        } catch (error) {
            this.logger.error(`Error processing regioes: ${error}`);
            throw error;
        } finally {
            // Close file stream
            fileStream.end();
        }
        return total;
    }

    /**
     * Generic paginated SQL execution that writes CSV rows to a file stream.
     * The `parseJson` callback extracts fields from valor_json into the row,
     * and `processRow` converts each row into a flat object for the CSV parser.
     */
    private async executeSqlAndWriteToFile<T extends RetornoDb & { valor_json: any }>(
        label: string,
        query: string,
        fileStream: any,
        parser: Parser<any, any>,
        params: any[],
        parseJson: (row: T) => void,
        processRow: (row: T) => Record<string, any>
    ): Promise<number> {
        let rowCount = 0;
        let batchCount = 0;

        try {
            this.logger.debug(`Executing ${label} SQL with params: ${params.join(', ')}`);

            let offset = 0;
            let hasMore = true;

            while (hasMore) {
                const paginatedQuery = `${query} LIMIT ${BATCH_SIZE} OFFSET ${offset}`;

                try {
                    if (offset === 0) {
                        this.logger.debug(`First batch SQL query params: ${JSON.stringify(params)}`);
                    }

                    const results: T[] = await this.prisma.$queryRawUnsafe(paginatedQuery, ...params);

                    if (!results || results.length === 0) {
                        if (offset === 0) {
                            this.logger.warn(`Query returned no results`);
                        } else {
                            this.logger.debug(`No more results at offset ${offset}`);
                        }
                        hasMore = false;
                        continue;
                    }

                    batchCount++;
                    offset += results.length;

                    if (batchCount === 1) {
                        this.logger.debug(`First result sample: ${JSON.stringify(results[0]).substring(0, 300)}...`);
                        this.logger.debug(`Result contains ${results.length} rows`);
                    }

                    const processedBatch: Record<string, any>[] = [];
                    for (const row of results) {
                        try {
                            parseJson(row);
                            processedBatch.push(processRow(row));
                            rowCount++;
                        } catch (rowErr) {
                            this.logger.error(`Error processing row: ${rowErr}`);
                        }
                    }

                    if (processedBatch.length > 0) {
                        fileStream.write(parser.parse(processedBatch) + '\r\n');
                    }

                    if (batchCount % 10 === 0) {
                        this.logger.debug(`Processed ${rowCount} rows in ${batchCount} batches`);
                    }
                } catch (batchErr) {
                    this.logger.error(`Error processing batch at offset ${offset}: ${batchErr}`);
                    if (offset === 0) {
                        throw batchErr;
                    } else {
                        offset += BATCH_SIZE;
                    }
                }
            }

            this.logger.debug(`Completed processing with ${rowCount} total rows in ${batchCount} batches`);
        } catch (error) {
            this.logger.error(`Error executing SQL: ${error}`);
            throw error;
        }

        return rowCount;
    }

    private parseIndicadorJson(row: RetornoDbIndicadorJson): void {
        if (row.valor_json) {
            if (typeof row.valor_json === 'string') {
                try {
                    const parsed = JSON.parse(row.valor_json) as JsonRetornoDbIndicador;
                    row.valor = parsed.valor_nominal;
                    row.eh_previa = parsed.eh_previa || false;
                    row.valores_categorica = parsed.valores_categorica;
                } catch (parseErr) {
                    this.logger.warn(`Error parsing valor_json: ${parseErr}`);
                    row.valor = null;
                    row.eh_previa = false;
                    row.valores_categorica = null;
                }
            } else {
                row.valor = row.valor_json.valor_nominal;
                row.eh_previa = row.valor_json.eh_previa || false;
                row.valores_categorica = row.valor_json.valores_categorica;
            }
        } else {
            row.valor = null;
            row.eh_previa = false;
            row.valores_categorica = null;
        }
    }

    private parseRegiaoJson(row: RetornoDbRegiao): void {
        if (row.valor_json) {
            if (typeof row.valor_json === 'string') {
                try {
                    const parsed = JSON.parse(row.valor_json) as JsonRetornoDbVariavel;
                    row.valor = parsed.valor_nominal;
                    row.valor_categorica = parsed.valor_categorica;
                    row.valores_categorica = parsed.valores_categorica;
                } catch (parseErr) {
                    this.logger.warn(`Error parsing valor_json: ${parseErr}`);
                    row.valor = null;
                    row.valor_categorica = null;
                    row.valores_categorica = null;
                }
            } else {
                row.valor = row.valor_json.valor_nominal;
                row.valor_categorica = row.valor_json.valor_categorica;
                row.valores_categorica = row.valor_json.valores_categorica;
            }
        } else {
            row.valor = null;
            row.valor_categorica = null;
            row.valores_categorica = null;
        }
    }

    private executeSqlAndWriteToFileIndicador(
        query: string,
        fileStream: any,
        parser: Parser<any, any>,
        params: any[]
    ): Promise<number> {
        return this.executeSqlAndWriteToFile<RetornoDbIndicadorJson>(
            'Indicador',
            query,
            fileStream,
            parser,
            params,
            (row) => this.parseIndicadorJson(row),
            (row) => this.processRowForCsvIndicador(row)
        );
    }

    private executeSqlAndWriteToFileRegiao(
        query: string,
        fileStream: any,
        regioesDb: Regiao[],
        parser: Parser<any, any>,
        params: any[]
    ): Promise<number> {
        return this.executeSqlAndWriteToFile<RetornoDbRegiao>(
            'Regiao',
            query,
            fileStream,
            parser,
            params,
            (row) => this.parseRegiaoJson(row),
            (row) => this.processRowForCsvRegiao(row, regioesDb)
        );
    }

    /**
     * Process a database row into a nested object for CSV output (Indicator).
     * The Parser with flatten() transform handles dot-notation field paths.
     */
    private processRowForCsvIndicador(row: RetornoDbIndicadorJson): Record<string, any> {
        // Pre-format categorical values
        let valoresCategoricaStr: string | null = null;
        if (row.valores_categorica && Array.isArray(row.valores_categorica)) {
            valoresCategoricaStr = row.valores_categorica
                .map((v: CategoricaValorJson) => `${v.titulo}: ${v.quantidade}`)
                .join('; ');
        }

        return {
            ...this.buildBaseRow(row),
            data_referencia: row.data_referencia,
            serie: row.serie,
            data: row.data,
            // `null` e não `''`: ausência de valor precisa chegar NULL no CSV bruto. O `??`
            // preserva o zero legítimo. Indicador categórico segue sem valor numérico — o
            // dado útil está em `valores_categorica` (regra de domínio, fica na extração).
            valor: row.indicador_tipo === 'Categorica' ? null : (row.valor ?? null),
            eh_previa: row.eh_previa ? 'Sim' : 'Não',
            valores_categorica: valoresCategoricaStr,
        };
    }

    /**
     * Process a database row into a nested object for CSV output (Region).
     * The Parser with flatten() transform handles dot-notation field paths.
     */
    private processRowForCsvRegiao(row: RetornoDbRegiao, regioesDb: Regiao[]): Record<string, any> {
        // Pre-format categorical values
        let valoresCategoricaStr: string | null = null;
        if (row.valores_categorica && Array.isArray(row.valores_categorica)) {
            const counts = row.valores_categorica.reduce((acc: Record<string, number>, v: CategoricaValorJson) => {
                acc[v.titulo] = (acc[v.titulo] || 0) + 1;
                return acc;
            }, {});
            valoresCategoricaStr = Object.entries(counts)
                .map(([titulo, count]) => `${titulo}: ${count}`)
                .join('; ');
        } else if (row.valor_categorica) {
            valoresCategoricaStr = row.valor_categorica;
        }

        return {
            ...this.buildBaseRow(row),
            variavel: row.variavel_id
                ? {
                      codigo: row.variavel_codigo,
                      titulo: row.variavel_titulo,
                      id: +row.variavel_id,
                      orgao: {
                          id: +row.orgao_id,
                          sigla: row.orgao_sigla,
                      },
                  }
                : undefined,
            ...this.convertRowsRegiao(regioesDb, row),
            data_referencia: row.data_referencia,
            serie: row.serie,
            data: row.data,
            // Ver `processRowForCsvIndicador`: ausência vira `null`, e o `??` preserva o zero.
            valor: row.valor ?? null,
            valores_categorica: valoresCategoricaStr,
        };
    }

    /**
     * Stream rows for indicators (with JSON handling)
     */
    private async streamRowsIntoIndicador(stream: Readable, prismaTxn: Prisma.TransactionClient) {
        if (stream.destroyed || (stream as any).readableEnded) {
            this.logger.warn('Stream is already closed or ended, cannot write more data');
            return;
        }

        let offset: number = 0;
        let has_more: boolean = true;
        try {
            while (has_more) {
                const data: RetornoDbIndicadorJson[] = await prismaTxn.$queryRawUnsafe(`
                    SELECT *
                    FROM _report_data
                    LIMIT ${BATCH_SIZE} OFFSET ${offset} -- ${this.invalidatePreparedStatement}`);

                if (data.length === 0) {
                    has_more = false;
                    continue;
                }

                offset += data.length;

                for (const row of data) {
                    if (stream.destroyed || (stream as any).readableEnded) {
                        this.logger.warn('Stream closed during processing');
                        return;
                    }

                    // Process JSON values
                    let valor: string | null = null;
                    let eh_previa: boolean = false;
                    let valores_categorica: CategoricaValorJson[] | null = null;

                    if (row.valor_json) {
                        if (typeof row.valor_json === 'string') {
                            try {
                                const parsed = JSON.parse(row.valor_json) as JsonRetornoDbIndicador;
                                valor = parsed.valor_nominal;
                                eh_previa = parsed.eh_previa || false;
                                valores_categorica = parsed.valores_categorica;
                            } catch (parseErr) {
                                this.logger.warn(`Error parsing valor_json: ${parseErr}`);
                            }
                        } else {
                            valor = row.valor_json.valor_nominal;
                            eh_previa = row.valor_json.eh_previa || false;
                            valores_categorica = row.valor_json.valores_categorica;
                        }
                    }

                    const item = {
                        pdm_nome: row.pdm_nome,
                        indicador: {
                            codigo: row.indicador_codigo,
                            titulo: row.indicador_titulo,
                            contexto: row.indicador_contexto,
                            complemento: row.indicador_complemento,
                            id: +row.indicador_id,
                        },
                        meta: row.meta_id
                            ? { codigo: row.meta_codigo, titulo: row.meta_titulo, id: +row.meta_id }
                            : null,
                        meta_tags: row.meta_tags ? row.meta_tags : null,
                        iniciativa: row.iniciativa_id
                            ? { codigo: row.iniciativa_codigo, titulo: row.iniciativa_titulo, id: +row.iniciativa_id }
                            : null,
                        atividade: row.atividade_id
                            ? { codigo: row.atividade_codigo, titulo: row.atividade_titulo, id: +row.atividade_id }
                            : null,

                        data: row.data,
                        data_referencia: row.data_referencia,
                        serie: row.serie,
                        valor: valor,
                        eh_previa: eh_previa,
                        valores_categorica: valores_categorica,
                    };

                    stream.push(item);
                }
            }

            stream.push(null);
        } catch (error) {
            this.logger.error(`Error in streamRowsIntoIndicador: ${error}`);

            if (!stream.destroyed && !(stream as any).readableEnded) {
                stream.push(null);
            }
            throw error;
        }
    }

    /**
     * Stream rows for regions (with JSON handling)
     */
    private async streamRowsIntoRegiao(regioesDb: Regiao[], stream: Readable, prismaTxn: Prisma.TransactionClient) {
        if (stream.destroyed || (stream as any).readableEnded) {
            this.logger.warn('Stream is already closed or ended, cannot write more data');
            return;
        }

        let offset: number = 0;
        let has_more: boolean = true;
        try {
            while (has_more) {
                const data: RetornoDbRegiao[] = await prismaTxn.$queryRawUnsafe(`
                    SELECT *
                    FROM _report_data
                    LIMIT ${BATCH_SIZE} OFFSET ${offset} -- ${this.invalidatePreparedStatement}`);

                if (data.length === 0) {
                    has_more = false;
                    continue;
                }

                offset += data.length;

                for (const row of data) {
                    if (stream.destroyed || (stream as any).readableEnded) {
                        this.logger.warn('Stream closed during processing');
                        return;
                    }

                    // Process JSON values
                    if (row.valor_json) {
                        if (typeof row.valor_json === 'string') {
                            try {
                                const parsed = JSON.parse(row.valor_json) as JsonRetornoDbVariavel;
                                row.valor = parsed.valor_nominal;
                                row.valor_categorica = parsed.valor_categorica;
                                row.valores_categorica = parsed.valores_categorica;
                            } catch (parseErr) {
                                this.logger.warn(`Error parsing valor_json: ${parseErr}`);
                                row.valor = null;
                                row.valor_categorica = null;
                                row.valores_categorica = null;
                            }
                        } else {
                            row.valor = row.valor_json.valor_nominal;
                            row.valor_categorica = row.valor_json.valor_categorica;
                            row.valores_categorica = row.valor_json.valores_categorica;
                        }
                    }

                    const item = {
                        pdm_nome: row.pdm_nome,
                        indicador: {
                            codigo: row.indicador_codigo,
                            titulo: row.indicador_titulo,
                            contexto: row.indicador_contexto,
                            complemento: row.indicador_complemento,
                            id: +row.indicador_id,
                        },
                        meta: row.meta_id
                            ? { codigo: row.meta_codigo, titulo: row.meta_titulo, id: +row.meta_id }
                            : null,
                        meta_tags: row.meta_tags ? row.meta_tags : null,
                        iniciativa: row.iniciativa_id
                            ? { codigo: row.iniciativa_codigo, titulo: row.iniciativa_titulo, id: +row.iniciativa_id }
                            : null,
                        atividade: row.atividade_id
                            ? { codigo: row.atividade_codigo, titulo: row.atividade_titulo, id: +row.atividade_id }
                            : null,

                        data: row.data,
                        data_referencia: row.data_referencia,
                        serie: row.serie,
                        valor: row.valor,
                        valor_categorica: row.valor_categorica,
                        valores_categorica: row.valores_categorica,

                        variavel: row.variavel_id
                            ? {
                                  codigo: row.variavel_codigo,
                                  titulo: row.variavel_titulo,
                                  id: +row.variavel_id,
                                  orgao: {
                                      id: +row.orgao_id,
                                      sigla: row.orgao_sigla,
                                  },
                              }
                            : undefined,
                        ...this.convertRowsRegiao(regioesDb, row),
                    };

                    stream.push(item);
                }
            }

            stream.push(null);
        } catch (error) {
            this.logger.error(`Error in streamRowsIntoRegiao: ${error}`);

            if (!stream.destroyed && !(stream as any).readableEnded) {
                stream.push(null);
            }
            throw error;
        }
    }

    convertRowsRegiao(
        regioesDb: Regiao[],
        db: RetornoDbRegiao
    ): {
        regiao_nivel_4: RegiaoDto | null;
        regiao_nivel_3: RegiaoDto | null;
        regiao_nivel_2: RegiaoDto | null;
        regiao_nivel_1: RegiaoDto | null;
        regiao_id: number;
    } {
        const regiao_by_id: Record<number, (typeof regioesDb)[0]> = {};
        for (const r of regioesDb) {
            regiao_by_id[r.id] = r;
        }

        let regiao_nivel_4: number | null = null;
        let regiao_nivel_3: number | null = null;
        let regiao_nivel_2: number | null = null;
        let regiao_nivel_1: number | null = null;
        const regiao_id: number = db.regiao_id;

        const regiao = regiao_by_id[regiao_id];
        if (regiao) {
            if (regiao.nivel == 4) {
                regiao_nivel_4 = regiao.id;
                regiao_nivel_3 = regiao.parente_id!;
                regiao_nivel_2 = regiao_by_id[regiao_nivel_3].parente_id!;
                regiao_nivel_1 = regiao_by_id[regiao_nivel_2].parente_id!;
            } else if (regiao.nivel == 3) {
                regiao_nivel_3 = regiao.id;
                regiao_nivel_2 = regiao.parente_id!;
                regiao_nivel_1 = regiao_by_id[regiao_nivel_2].parente_id!;
            } else if (regiao.nivel == 2) {
                regiao_nivel_2 = regiao.id;
                regiao_nivel_1 = regiao.parente_id!;
            } else if (regiao.nivel == 1) {
                regiao_nivel_1 = regiao.id;
            }
        }

        return {
            regiao_nivel_4: this.render_regiao(regiao_by_id, regiao_nivel_4),
            regiao_nivel_3: this.render_regiao(regiao_by_id, regiao_nivel_3),
            regiao_nivel_2: this.render_regiao(regiao_by_id, regiao_nivel_2),
            regiao_nivel_1: this.render_regiao(regiao_by_id, regiao_nivel_1),
            regiao_id,
        };
    }

    render_regiao(regiao_by_id: Record<number, Regiao>, regiao_id: number | null): RegiaoDto | null {
        if (!regiao_id) return null;
        if (!regiao_by_id[regiao_id]) return null;

        return {
            codigo: regiao_by_id[regiao_id].codigo,
            descricao: regiao_by_id[regiao_id].descricao,
            id: regiao_by_id[regiao_id].id,
            nivel: regiao_by_id[regiao_id].nivel,
            parente_id: regiao_by_id[regiao_id].parente_id,
            pdm_codigo_sufixo: regiao_by_id[regiao_id].pdm_codigo_sufixo,
        };
    }

    getClassFileName(): string {
        return Path2FileName(__filename);
    }
}
