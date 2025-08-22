import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma, Regiao } from '@prisma/client';
import { createWriteStream } from 'fs';
import { DateTime } from 'luxon';
import { Readable } from 'stream';

import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { Date2YMD } from '../../common/date2ymd';
import { EmitErrorAndDestroyStream, Stream2PromiseIntoArray } from '../../common/helpers/Streaming';
import { PrismaService } from '../../prisma/prisma.service';
import { RegiaoBasica as RegiaoDto } from '../../regiao/entities/regiao.entity';
import { ReportContext } from '../relatorios/helpers/reports.contexto';
import { FileOutput, ReportableService, UtilsService } from '../utils/utils.service';
import { CreateRelIndicadorDto, CreateRelIndicadorRegioesDto } from './dto/create-indicadores.dto';
import { ListIndicadoresDto, RelIndicadoresDto, RelIndicadoresVariaveisDto } from './entities/indicadores.entity';

const BATCH_SIZE = 500;
const CREATE_TEMP_TABLE = 'CREATE TEMP TABLE _report_data ON COMMIT DROP AS';

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
}

type JsonRetornoDb = {
    valor_nominal: string;
    atualizado_em: Date;
    valor_categorica: string | null;
};

class RetornoDbRegiao extends RetornoDb {
    valor_json: JsonRetornoDb;
    regiao_id: number;
}

@Injectable()
export class IndicadoresService implements ReportableService {
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

        const sql = `${CREATE_TEMP_TABLE} SELECT
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
        i.complemento as indicador_complemento,
        i.contexto as indicador_contexto,
        :DATA: as "data",
        dt.dt::date::text as "data_referencia",
        series.serie,
        round(
            valor_indicador_em(
                i.id,
                series.serie,
                dt.dt::date,
                :JANELA:
            ),
            i.casas_decimais
        )::text as valor
        from generate_series($1::date, $2::date, $3::interval) dt
        cross join (select 'Realizado'::"Serie" as serie UNION ALL select 'RealizadoAcumulado'::"Serie" as serie ) series
        join ${queryFromWhere}
        where dt.dt >= i.inicio_medicao AND dt.dt < i.fim_medicao + (select periodicidade_intervalo(i.periodicidade))
        `;

        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                if (dto.tipo == 'Mensal' && dto.mes) {
                    await this.rodaQueryMensalAnalitico(prismaTxn, sql, dto.ano, dto.mes);
                    await this.streamRowsInto(null, stream, prismaTxn);
                } else if (dto.periodo == 'Anual' && dto.tipo == 'Analitico') {
                    await this.rodaQueryAnualAnalitico(prismaTxn, sql, anoInicial);

                    for (let ano = anoInicial + 1; ano <= dto.ano; ano++) {
                        await this.rodaQueryAnualAnalitico(prismaTxn, this.replaceCreateToInsert(sql), ano);
                    }

                    await this.streamRowsInto(null, stream, prismaTxn);
                } else if (dto.periodo == 'Anual' && dto.tipo == 'Consolidado') {
                    await this.rodaQueryAnualConsolidado(prismaTxn, sql, dto.ano);

                    await this.streamRowsInto(null, stream, prismaTxn);
                } else if (dto.periodo == 'Semestral' && dto.tipo == 'Consolidado') {
                    const tipo = dto.semestre == 'Primeiro' ? 'Primeiro' : 'Segundo';
                    const ano = dto.ano;

                    await this.rodaQuerySemestralConsolidado(tipo, ano, prismaTxn, sql);

                    await this.streamRowsInto(null, stream, prismaTxn);
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

                    await this.streamRowsInto(null, stream, prismaTxn);
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
        `;

        const regioes = await this.prisma.regiao.findMany({
            where: { removido_em: null },
        });
        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                if (dto.tipo == 'Mensal' && dto.mes) {
                    await this.rodaQueryMensalAnalitico(prismaTxn, sql, dto.ano, dto.mes);
                    await this.streamRowsInto(regioes, stream, prismaTxn);
                } else if (dto.periodo == 'Anual' && dto.tipo == 'Analitico') {
                    await this.rodaQueryAnualAnalitico(prismaTxn, sql, anoInicial);

                    for (let ano = anoInicial + 1; ano <= dto.ano; ano++) {
                        await this.rodaQueryAnualAnalitico(prismaTxn, this.replaceCreateToInsert(sql), ano);
                    }

                    await this.streamRowsInto(regioes, stream, prismaTxn);
                } else if (dto.periodo == 'Anual' && dto.tipo == 'Consolidado') {
                    await this.rodaQueryAnualConsolidado(prismaTxn, sql, dto.ano);

                    await this.streamRowsInto(regioes, stream, prismaTxn);
                } else if (dto.periodo == 'Semestral' && dto.tipo == 'Consolidado') {
                    const tipo = dto.semestre == 'Primeiro' ? 'Primeiro' : 'Segundo';
                    const ano = dto.ano;

                    await this.rodaQuerySemestralConsolidado(tipo, ano, prismaTxn, sql);

                    await this.streamRowsInto(regioes, stream, prismaTxn);
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

                    await this.streamRowsInto(regioes, stream, prismaTxn);
                }
            },
            {
                maxWait: 1000000,
                timeout: 60 * 1000 * 15,
                isolationLevel: 'Serializable',
            }
        );
    }

    private buildFieldDefinitions(pdm: any, params: any): any[] {
        const camposMetaIniAtv = [
            { value: 'meta.codigo', label: 'Código da Meta' },
            { value: 'meta.titulo', label: 'Título da Meta' },
            { value: 'meta.id', label: 'ID da Meta' },
            {
                value: (row: RetornoDb) => {
                    if (!row.meta_tags || !Array.isArray(row.meta_tags)) return '';
                    return row.meta_tags.map((t) => t.descricao).join(';');
                },
                label: 'Meta Tags',
            },
            {
                value: (row: RetornoDb) => {
                    if (!row.meta_tags || !Array.isArray(row.meta_tags)) return '';
                    return row.meta_tags.map((t) => t.id).join(';');
                },
                label: 'Tags IDs',
            },
            { value: 'iniciativa.codigo', label: 'Código da ' + pdm.rotulo_iniciativa },
            { value: 'iniciativa.titulo', label: 'Título da ' + pdm.rotulo_iniciativa },
            { value: 'iniciativa.id', label: 'ID da ' + pdm.rotulo_iniciativa },
            { value: 'atividade.codigo', label: 'Código da ' + pdm.rotulo_atividade },
            { value: 'atividade.titulo', label: 'Título da ' + pdm.rotulo_atividade },
            { value: 'atividade.id', label: 'ID da ' + pdm.rotulo_atividade },

            { value: 'indicador.codigo', label: 'Código do Indicador' },
            { value: 'indicador.titulo', label: 'Título do Indicador' },
            { value: 'indicador.contexto', label: pdm.rotulo_contexto_meta },
            { value: 'indicador.complemento', label: pdm.rotulo_complementacao_meta },
            { value: 'indicador.id', label: 'ID do Indicador' },
        ];

        if (params.tipo_pdm == 'PS') camposMetaIniAtv.unshift({ value: 'pdm_nome', label: 'Plano Setorial' });

        return camposMetaIniAtv;
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

        const pdm = await this.prisma.pdm.findUniqueOrThrow({ where: { id: params.pdm_id } });
        const out: FileOutput[] = [];

        const tmpIndic = ctx.getTmpFile('indicadores.csv');
        const tmpRegio = ctx.getTmpFile('regioes.csv');

        try {
            // Build field definitions
            const camposMetaIniAtv = this.buildFieldDefinitions(pdm, params);
            // Process indicadores - execute SQL query directly
            const indicadoresCount = await this.processDadosIndicadores(
                indicadores,
                params,
                camposMetaIniAtv,
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

            // Process regioes - execute SQL query directly
            const regioesCount = await this.processDadosRegioes(
                indicadores,
                params as CreateRelIndicadorRegioesDto,
                camposMetaIniAtv,
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
        camposMetaIniAtv: any[],
        filePath: string
    ): Promise<number> {
        let total = 0;
        // Create file stream
        const fileStream = createWriteStream(filePath);

        // Write header
        const header = [
            ...camposMetaIniAtv.map((field) => (typeof field === 'object' ? field.label : field)),
            'Data de Referência',
            'Serie',
            'Data',
            'Valor',
        ]
            .map((h) => this.escapeCsvField(h))
            .join(',');

        fileStream.write(header + '\n');

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
            i.complemento as indicador_complemento,
            i.contexto as indicador_contexto,
            ${this.getDataExpression(params)} as "data",
            dt.dt::date::text as "data_referencia",
            series.serie,
            round(
                valor_indicador_em(
                    i.id,
                    series.serie,
                    dt.dt::date,
                    ${this.getJanelaExpression(params)}
                ),
                i.casas_decimais
            )::text as valor
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
        `;

        try {
            // Handle different query types
            if (params.tipo == 'Mensal' && params.mes) {
                // For Mensal, query a single month
                total += Number(
                    await this.executeSqlAndWriteToFile(queryBase, fileStream, null, camposMetaIniAtv, [
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
                        await this.executeSqlAndWriteToFile(queryBase, fileStream, null, camposMetaIniAtv, [
                            `${ano}-01-01`,
                            `${ano}-12-01`,
                            '1 month',
                        ])
                    );
                }
            } else if (params.periodo == 'Anual' && params.tipo == 'Consolidado') {
                // For Anual Consolidado, query the whole year
                total += Number(
                    await this.executeSqlAndWriteToFile(queryBase, fileStream, null, camposMetaIniAtv, [
                        `${params.ano}-12-01`,
                        `${params.ano}-12-01`,
                        '1 year',
                    ])
                );
            }
            // Add other query types as needed
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
        camposMetaIniAtv: any[],
        filePath: string
    ): Promise<number> {
        let total = 0;
        // Create file stream
        const fileStream = createWriteStream(filePath);

        // Fields for regioes
        const regioesFields = [
            { value: 'variavel.orgao.id', label: 'ID do órgão' },
            { value: 'variavel.orgao.sigla', label: 'Sigla do órgão' },
            { value: 'variavel.codigo', label: 'Código da Variável' },
            { value: 'variavel.titulo', label: 'Título da Variável' },
            { value: 'variavel.id', label: 'ID da Variável' },
            { value: 'regiao_id', label: 'ID da região' },
            { value: 'regiao_nivel_4.id', label: 'ID do Distrito' },
            { value: 'regiao_nivel_4.codigo', label: 'Código do Distrito' },
            { value: 'regiao_nivel_4.descricao', label: 'Descrição do Distrito' },
            { value: 'regiao_nivel_3.id', label: 'ID do Subprefeitura' },
            { value: 'regiao_nivel_3.codigo', label: 'Código da Subprefeitura' },
            { value: 'regiao_nivel_3.descricao', label: 'Descrição da Subprefeitura' },
            { value: 'regiao_nivel_2.id', label: 'ID da Região' },
            { value: 'regiao_nivel_2.codigo', label: 'Código da Região' },
            { value: 'regiao_nivel_2.descricao', label: 'Descrição da Região' },
        ];

        // Write header
        const header = [
            ...camposMetaIniAtv.map((field) => (typeof field === 'object' ? field.label : field)),
            ...regioesFields.map((field) => field.label),
            'Data de Referência',
            'Serie',
            'Data',
            'Valor',
            'Valor Categórica',
        ]
            .map((h) => this.escapeCsvField(h))
            .join(',');

        fileStream.write(header + '\n');

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
                    await this.executeSqlAndWriteToFile(
                        queryBase,
                        fileStream,
                        regioes,
                        [...camposMetaIniAtv, ...regioesFields],
                        [`${params.ano}-${params.mes}-01`, `${params.ano}-${params.mes}-01`, '1 month'],
                        true // isRegioes flag
                    )
                );
            } else if (params.periodo == 'Anual' && params.tipo == 'Analitico') {
                this.logger.debug(`Executing Anual Analitico query for regioes from ${anoInicial} to ${params.ano}`);

                for (let ano = anoInicial; ano <= params.ano; ano++) {
                    this.logger.debug(`Processing year ${ano} for regioes`);
                    total += Number(
                        await this.executeSqlAndWriteToFile(
                            queryBase,
                            fileStream,
                            regioes,
                            [...camposMetaIniAtv, ...regioesFields],
                            [`${ano}-01-01`, `${ano}-12-01`, '1 month'],
                            true // isRegioes flag
                        )
                    );
                }
            } else if (params.periodo == 'Anual' && params.tipo == 'Consolidado') {
                this.logger.debug(`Executing Anual Consolidado query for regioes`);
                total += Number(
                    await this.executeSqlAndWriteToFile(
                        queryBase,
                        fileStream,
                        regioes,
                        [...camposMetaIniAtv, ...regioesFields],
                        [`${params.ano}-12-01`, `${params.ano}-12-01`, '1 year'],
                        true // isRegioes flag
                    )
                );
            } else if (params.periodo == 'Semestral' && params.tipo == 'Consolidado') {
                const tipo = params.semestre == 'Primeiro' ? 'Primeiro' : 'Segundo';
                const dataAno = tipo == 'Primeiro' ? params.ano + '-06-01' : params.ano + '-12-01';

                this.logger.debug(`Executing Semestral Consolidado query for regioes: ${tipo} ${params.ano}`);
                total += Number(
                    await this.executeSqlAndWriteToFile(
                        queryBase,
                        fileStream,
                        regioes,
                        [...camposMetaIniAtv, ...regioesFields],
                        [dataAno, dataAno, '1 second'],
                        true // isRegioes flag
                    )
                );
            } else if (params.periodo == 'Semestral' && params.tipo == 'Analitico') {
                const tipo = params.semestre == 'Primeiro' ? 'Primeiro' : 'Segundo';

                for (let ano = anoInicial; ano <= params.ano; ano++) {
                    const semestreInicio = tipo === 'Segundo' ? ano + '-12-01' : ano + '-06-01';

                    this.logger.debug(`Executing Semestral Analitico query for regioes: ${tipo} ${ano}`);
                    total += Number(
                        await this.executeSqlAndWriteToFile(
                            queryBase,
                            fileStream,
                            regioes,
                            [...camposMetaIniAtv, ...regioesFields],
                            [
                                DateTime.fromISO(semestreInicio)
                                    .minus({ months: tipo === 'Segundo' ? 11 : 5 })
                                    .toISODate(),
                                semestreInicio,
                                '1 month',
                            ],
                            true // isRegioes flag
                        )
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
     * Execute SQL and write results to file
     */
    /**
     * Execute SQL and write results to file with improved error handling and debugging
     */
    private async executeSqlAndWriteToFile(
        query: string,
        fileStream: any,
        regioesDb: Regiao[] | null,
        fields: any[],
        params: any[],
        isRegioes: boolean = false
    ): Promise<number> {
        let rowCount = 0;
        let batchCount = 0;

        try {
            this.logger.debug(`Executing SQL with params: ${params.join(', ')}`);

            // Execute in batches
            let offset = 0;
            let hasMore = true;

            while (hasMore) {
                // Execute the query with pagination
                const paginatedQuery = `${query} LIMIT ${BATCH_SIZE} OFFSET ${offset}`;

                try {
                    // Log the first query execution for debugging
                    if (offset === 0) {
                        this.logger.debug(`First batch SQL query params: ${JSON.stringify(params)}`);
                    }

                    const results: any[] = await this.prisma.$queryRawUnsafe(paginatedQuery, ...params);

                    if (!results || results.length === 0) {
                        if (offset === 0) {
                            this.logger.warn(`Query returned no results: ${paginatedQuery.substring(0, 300)}...`);
                        } else {
                            this.logger.debug(`No more results at offset ${offset}`);
                        }
                        hasMore = false;
                        continue;
                    }

                    batchCount++;
                    offset += results.length;

                    // Log the first result for debugging on first batch
                    if (batchCount === 1) {
                        this.logger.debug(`First result sample: ${JSON.stringify(results[0]).substring(0, 300)}...`);
                        this.logger.debug(`Result contains ${results.length} rows`);
                    }

                    // Process each row
                    for (const row of results) {
                        try {
                            // Process JSON values if present
                            if ('valor_json' in row && row.valor_json) {
                                if (typeof row.valor_json === 'string') {
                                    try {
                                        const parsed = JSON.parse(row.valor_json);
                                        row.valor = parsed.valor_nominal;
                                        row.valor_categorica = parsed.valor_categorica;
                                    } catch (parseErr) {
                                        this.logger.warn(`Error parsing valor_json: ${parseErr}`);
                                        row.valor = null;
                                        row.valor_categorica = null;
                                    }
                                } else {
                                    row.valor = row.valor_json.valor_nominal;
                                    row.valor_categorica = row.valor_json.valor_categorica;
                                }
                            }

                            // Convert to structured object
                            const processedRow = this.processRowForCsv(row, regioesDb);

                            // Create CSV line and write to file
                            const csvLine = this.createCsvLine(processedRow, fields, isRegioes);
                            fileStream.write(csvLine + '\n');
                            rowCount++;
                        } catch (rowErr) {
                            this.logger.error(`Error processing row: ${rowErr}`);
                            // Continue with next row
                        }
                    }

                    if (batchCount % 10 === 0) {
                        this.logger.debug(`Processed ${rowCount} rows in ${batchCount} batches`);
                    }
                } catch (batchErr) {
                    this.logger.error(`Error processing batch at offset ${offset}: ${batchErr}`);
                    if (offset === 0) {
                        // If the first batch fails, stop processing
                        throw batchErr;
                    } else {
                        // If a subsequent batch fails, try to continue with the next batch
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

    /**
     * Build direct query without using temp tables
     */
    private buildDirectQuery(queryFromWhere: string): string {
        return `SELECT
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
    i.complemento as indicador_complemento,
    i.contexto as indicador_contexto,
    :DATA: as "data",
    dt.dt::date::text as "data_referencia",
    series.serie,
    round(
        valor_indicador_em(
            i.id,
            series.serie,
            dt.dt::date,
            :JANELA:
        ),
        i.casas_decimais
    )::text as valor
    from generate_series($1::date, $2::date, $3::interval) dt
    cross join (select 'Realizado'::"Serie" as serie UNION ALL select 'RealizadoAcumulado'::"Serie" as serie ) series
    join ${queryFromWhere}
    where dt.dt >= i.inicio_medicao AND dt.dt < i.fim_medicao + (select periodicidade_intervalo(i.periodicidade))`;
    }

    /**
     * Process query results directly to file for Mensal Analitico
     */
    private async processQueryDirectlyToFile(
        prismaTxn: Prisma.TransactionClient,
        sql: string,
        fileStream: any,
        regioesDb: Regiao[] | null,
        fields: any[],
        ano: number,
        mes: number
    ): Promise<void> {
        const query = sql
            .replace(':JANELA:', "extract('month' from periodicidade_intervalo(i.periodicidade))::int")
            .replace(':DATA:', 'dt.dt::date::text');

        // Execute query and process results in batches
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
            // We have to handle pagination ourselves since we're not using LIMIT/OFFSET in the SQL
            const data: any = await prismaTxn.$queryRawUnsafe(
                query + ` OFFSET ${offset} LIMIT ${BATCH_SIZE}`,
                ano + '-' + mes + '-01',
                ano + '-' + mes + '-01',
                '1 month'
            );

            if (!data || data.length === 0) {
                hasMore = false;
                continue;
            }

            offset += data.length;

            // Process and write each row
            for (const row of data) {
                if ('valor_json' in row && row.valor_json) {
                    row.valor = row.valor_json.valor_nominal;
                    row.valor_categorica = row.valor_json.valor_categorica;
                }

                // Process row and write to file
                const processedRow = this.processRowForCsv(row, regioesDb);
                const csvLine = this.createCsvLine(processedRow, fields);
                fileStream.write(csvLine + '\n');
            }
        }
    }

    /**
     * Process query results directly to file for Anual Analitico
     */
    private async processAnualAnaliticoDirectlyToFile(
        prismaTxn: Prisma.TransactionClient,
        sql: string,
        fileStream: any,
        regioesDb: Regiao[] | null,
        fields: any[],
        ano: number
    ): Promise<void> {
        const query = sql
            .replace(':JANELA:', "extract('month' from periodicidade_intervalo(i.periodicidade))::int")
            .replace(':DATA:', 'dt.dt::date::text');

        // Execute query and process results in batches
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
            const data: any = await prismaTxn.$queryRawUnsafe(
                query + ` OFFSET ${offset} LIMIT ${BATCH_SIZE}`,
                ano + '-01-01',
                ano + '-12-01',
                '1 month'
            );

            if (!data || data.length === 0) {
                hasMore = false;
                continue;
            }

            offset += data.length;

            // Process and write each row
            for (const row of data) {
                if ('valor_json' in row && row.valor_json) {
                    row.valor = row.valor_json.valor_nominal;
                    row.valor_categorica = row.valor_json.valor_categorica;
                }

                // Process row and write to file
                const processedRow = this.processRowForCsv(row, regioesDb);
                const csvLine = this.createCsvLine(processedRow, fields);
                fileStream.write(csvLine + '\n');
            }
        }
    }

    /**
     * Process query results directly to file for Anual Consolidado
     */
    private async processAnualConsolidadoDirectlyToFile(
        prismaTxn: Prisma.TransactionClient,
        sql: string,
        fileStream: any,
        regioesDb: Regiao[] | null,
        fields: any[],
        ano: number
    ): Promise<void> {
        const query = sql
            .replace(':JANELA:', '12')
            .replace(':DATA:', "(dt.dt::date - '11 months'::interval)::date::text || '/' || (dt.dt::date)");

        // Execute query and process results in batches
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
            const data: any = await prismaTxn.$queryRawUnsafe(
                query + ` OFFSET ${offset} LIMIT ${BATCH_SIZE}`,
                ano + '-12-01',
                ano + '-12-01',
                '1 year'
            );

            if (!data || data.length === 0) {
                hasMore = false;
                continue;
            }

            offset += data.length;

            // Process and write each row
            for (const row of data) {
                if ('valor_json' in row && row.valor_json) {
                    row.valor = row.valor_json.valor_nominal;
                    row.valor_categorica = row.valor_json.valor_categorica;
                }

                // Process row and write to file
                const processedRow = this.processRowForCsv(row, regioesDb);
                const csvLine = this.createCsvLine(processedRow, fields);
                fileStream.write(csvLine + '\n');
            }
        }
    }

    /**
     * Generate CSV file for regioes by writing directly from database
     */
    private async generateRegioesCsv(
        indicadoresIds: number[],
        params: CreateRelIndicadorRegioesDto,
        camposMetaIniAtv: any[],
        filePath: string
    ): Promise<void> {
        // Create file stream
        const fileStream = createWriteStream(filePath);

        // Write header with additional fields for regioes
        const regioesFields = [
            { value: 'variavel.orgao.id', label: 'ID do órgão' },
            { value: 'variavel.orgao.sigla', label: 'Sigla do órgão' },
            { value: 'variavel.codigo', label: 'Código da Variável' },
            { value: 'variavel.titulo', label: 'Título da Variável' },
            { value: 'variavel.id', label: 'ID da Variável' },
            { value: 'regiao_id', label: 'ID da região' },
            { value: 'regiao_nivel_4.id', label: 'ID do Distrito' },
            { value: 'regiao_nivel_4.codigo', label: 'Código do Distrito' },
            { value: 'regiao_nivel_4.descricao', label: 'Descrição do Distrito' },
            { value: 'regiao_nivel_3.id', label: 'ID do Subprefeitura' },
            { value: 'regiao_nivel_3.codigo', label: 'Código da Subprefeitura' },
            { value: 'regiao_nivel_3.descricao', label: 'Descrição da Subprefeitura' },
            { value: 'regiao_nivel_2.id', label: 'ID da Região' },
            { value: 'regiao_nivel_2.codigo', label: 'Código da Região' },
            { value: 'regiao_nivel_2.descricao', label: 'Descrição da Região' },
        ];

        const header = [
            ...camposMetaIniAtv.map((field) => (typeof field === 'object' ? field.label : field)),
            ...regioesFields.map((field) => field.label),
            'Data de Referência',
            'Serie',
            'Data',
            'Valor',
            'Valor Categórica',
        ]
            .map((h) => this.escapeCsvField(h))
            .join(',');

        fileStream.write(header + '\n');

        // Process in transaction
        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                let queryFromWhere = `indicador i ON i.id IN (${indicadoresIds.join(',')})
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

                if (Array.isArray(params.regioes)) {
                    const numbers = params.regioes.map((n) => +n).join(',');
                    queryFromWhere = `${queryFromWhere} AND v.regiao_id IN (${numbers})`;
                }

                const anoInicial = await this.capturaAnoSerieVariavelInicial(params, queryFromWhere);

                const sql = `${CREATE_TEMP_TABLE} SELECT
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
                `;

                const regioes = await this.prisma.regiao.findMany({
                    where: { removido_em: null },
                });

                // Execute query based on params type
                if (params.tipo == 'Mensal' && params.mes) {
                    await this.rodaQueryMensalAnalitico(prismaTxn, sql, params.ano, params.mes);
                    await this.writeRowsToFile(regioes, fileStream, prismaTxn, [...camposMetaIniAtv, ...regioesFields]);
                } else if (params.periodo == 'Anual' && params.tipo == 'Analitico') {
                    await this.rodaQueryAnualAnalitico(prismaTxn, sql, anoInicial);

                    for (let ano = anoInicial + 1; ano <= params.ano; ano++) {
                        await this.rodaQueryAnualAnalitico(prismaTxn, this.replaceCreateToInsert(sql), ano);
                    }

                    await this.writeRowsToFile(regioes, fileStream, prismaTxn, [...camposMetaIniAtv, ...regioesFields]);
                } else if (params.periodo == 'Anual' && params.tipo == 'Consolidado') {
                    await this.rodaQueryAnualConsolidado(prismaTxn, sql, params.ano);

                    await this.writeRowsToFile(regioes, fileStream, prismaTxn, [...camposMetaIniAtv, ...regioesFields]);
                } else if (params.periodo == 'Semestral' && params.tipo == 'Consolidado') {
                    const tipo = params.semestre == 'Primeiro' ? 'Primeiro' : 'Segundo';
                    const ano = params.ano;

                    await this.rodaQuerySemestralConsolidado(tipo, ano, prismaTxn, sql);

                    await this.writeRowsToFile(regioes, fileStream, prismaTxn, [...camposMetaIniAtv, ...regioesFields]);
                } else if (params.periodo == 'Semestral' && params.tipo == 'Analitico') {
                    const tipo = params.semestre == 'Primeiro' ? 'Primeiro' : 'Segundo';
                    const ano = anoInicial;

                    const semestreInicio = tipo === 'Segundo' ? ano + '-12-01' : ano + '-06-01';

                    await this.rodaQuerySemestralAnalitico(prismaTxn, sql, semestreInicio, tipo);

                    for (let ano = anoInicial + 1; ano <= params.ano; ano++) {
                        const semestreInicio = tipo === 'Segundo' ? ano + '-12-01' : ano + '-06-01';

                        await this.rodaQuerySemestralAnalitico(
                            prismaTxn,
                            this.replaceCreateToInsert(sql),
                            semestreInicio,
                            tipo
                        );
                    }

                    await this.writeRowsToFile(regioes, fileStream, prismaTxn, [...camposMetaIniAtv, ...regioesFields]);
                }
            },
            {
                maxWait: 1000000,
                timeout: 60 * 1000 * 15,
                isolationLevel: 'Serializable',
            }
        );

        // Close file stream
        fileStream.end();
    }

    /**
     * Write rows directly from database to file without storing in memory
     */
    private async writeRowsToFile(
        regioesDb: Regiao[] | null,
        fileStream: any,
        prismaTxn: Prisma.TransactionClient,
        fields: any[]
    ): Promise<void> {
        let offset: number = 0;
        let has_more: boolean = true;

        while (has_more) {
            const data: RetornoDb[] | RetornoDbRegiao[] = await prismaTxn.$queryRawUnsafe(`
                SELECT *
                FROM _report_data
                LIMIT ${BATCH_SIZE} OFFSET ${offset} -- ${this.invalidatePreparedStatement}`);

            if (data.length === 0) {
                has_more = false;
                continue;
            }

            offset += data.length;

            for (const row of data) {
                if ('valor_json' in row && row.valor_json) {
                    row.valor = row.valor_json.valor_nominal;
                    row.valor_categorica = row.valor_json.valor_categorica;
                }

                // Process the row directly
                const processedRow = this.processRowForCsv(row, regioesDb);

                // Create CSV line
                const csvLine = this.createCsvLine(processedRow, fields);

                // Write directly to file
                fileStream.write(csvLine + '\n');
            }
        }
    }

    /**
     * Process a database row into a flattened object for CSV output
     */
    private processRowForCsv(row: RetornoDb | RetornoDbRegiao, regioesDb: Regiao[] | null): Record<string, any> {
        // Convert row to structured object
        const item = {
            pdm_nome: row.pdm_nome,
            indicador: {
                codigo: row.indicador_codigo,
                titulo: row.indicador_titulo,
                contexto: row.indicador_contexto,
                complemento: row.indicador_complemento,
                id: +row.indicador_id,
            },
            meta: row.meta_id ? { codigo: row.meta_codigo, titulo: row.meta_titulo, id: +row.meta_id } : null,
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
            ...('regiao_id' in row && regioesDb ? this.convertRowsRegiao(regioesDb, row as RetornoDbRegiao) : {}),
        };

        // Flatten the object to match field paths
        return this.flattenObject(item);
    }

    /**
     * Create a CSV line from a flattened object using field definitions
     */
    /**
     * Create a CSV line from a flattened object using field definitions
     * Improved to handle region-specific data
     */
    private createCsvLine(flatItem: Record<string, any>, fields: any[], isRegioes: boolean = false): string {
        // Extract values for each field in the fields array
        const fieldValues = fields.map((field) => {
            let value;

            // Extract value based on field definition
            if (typeof field === 'object' && field.value) {
                if (typeof field.value === 'function') {
                    // For function fields, we can't easily apply them
                    // Just use a placeholder value for now
                    value = '';
                } else {
                    value = flatItem[field.value];
                }
            } else {
                value = flatItem[field];
            }

            // Handle undefined/null
            if (value === undefined || value === null) {
                return '';
            }

            // Format the value
            return this.escapeCsvField(value);
        });

        // Add standard fields
        const standardFields = [
            this.escapeCsvField(flatItem['data_referencia'] || ''),
            this.escapeCsvField(flatItem['serie'] || ''),
            this.escapeCsvField(flatItem['data'] || ''),
            this.escapeCsvField(flatItem['valor'] || ''),
        ];

        // For regions, add the valor_categorica field
        if (isRegioes) {
            standardFields.push(this.escapeCsvField(flatItem['valor_categorica'] || ''));
        }

        // Combine field values and standard fields
        return [...fieldValues, ...standardFields].join(',');
    }

    /**
     * Escape a field for CSV output
     */
    private escapeCsvField(value: any): string {
        if (value === undefined || value === null) {
            return '';
        }

        // Handle arrays (like meta_tags)
        if (Array.isArray(value)) {
            return this.escapeCsvField(value.join(';'));
        }

        const stringValue = String(value);

        // Check if we need to quote this field
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            // Escape quotes by doubling them and wrap in quotes
            return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
    }

    /**
     * Flatten a nested object to match field paths
     */
    private flattenObject(item: any): Record<string, any> {
        const result: Record<string, any> = {};

        // Handle top-level properties
        ['pdm_nome', 'data', 'data_referencia', 'serie', 'valor', 'valor_categorica', 'regiao_id'].forEach((key) => {
            if (item[key] !== undefined) {
                result[key] = item[key];
            }
        });

        // Process nested 'indicador' properties
        if (item.indicador) {
            Object.keys(item.indicador).forEach((key) => {
                result[`indicador.${key}`] = item.indicador[key];
            });
        }

        // Handle nested 'meta' properties
        if (item.meta) {
            Object.keys(item.meta).forEach((key) => {
                result[`meta.${key}`] = item.meta[key];
            });
        }

        // Special handling for meta_tags
        if (item.meta_tags) {
            result['meta_tags'] = item.meta_tags;
        }

        // Handle nested 'iniciativa' properties
        if (item.iniciativa) {
            Object.keys(item.iniciativa).forEach((key) => {
                result[`iniciativa.${key}`] = item.iniciativa[key];
            });
        }

        // Handle nested 'atividade' properties
        if (item.atividade) {
            Object.keys(item.atividade).forEach((key) => {
                result[`atividade.${key}`] = item.atividade[key];
            });
        }

        // Handle nested 'variavel' properties
        if (item.variavel) {
            Object.keys(item.variavel).forEach((key) => {
                if (key === 'orgao' && item.variavel.orgao) {
                    Object.keys(item.variavel.orgao).forEach((orgaoKey) => {
                        result[`variavel.orgao.${orgaoKey}`] = item.variavel.orgao[orgaoKey];
                    });
                } else {
                    result[`variavel.${key}`] = item.variavel[key];
                }
            });
        }

        // Handle nested region properties
        ['regiao_nivel_1', 'regiao_nivel_2', 'regiao_nivel_3', 'regiao_nivel_4'].forEach((regionLevel) => {
            if (item[regionLevel]) {
                Object.keys(item[regionLevel]).forEach((key) => {
                    result[`${regionLevel}.${key}`] = item[regionLevel][key];
                });
            }
        });

        return result;
    }

    private async streamRowsInto(regioesDb: Regiao[] | null, stream: Readable, prismaTxn: Prisma.TransactionClient) {
        // Check if stream is already ended
        if (stream.destroyed || (stream as any).readableEnded) {
            this.logger.warn('Stream is already closed or ended, cannot write more data');
            return;
        }

        let offset: number = 0;
        let has_more: boolean = true;
        try {
            while (has_more) {
                const data: RetornoDb[] | RetornoDbRegiao[] = await prismaTxn.$queryRawUnsafe(`
                    SELECT *
                    FROM _report_data
                    LIMIT ${BATCH_SIZE} OFFSET ${offset} -- ${this.invalidatePreparedStatement}`);

                if (data.length === 0) {
                    has_more = false;
                    continue;
                }

                offset += data.length;

                for (const row of data) {
                    // Check again in the loop to ensure stream is still open
                    if (stream.destroyed || (stream as any).readableEnded) {
                        this.logger.warn('Stream closed during processing');
                        return;
                    }

                    if ('valor_json' in row && row.valor_json) {
                        row.valor = row.valor_json.valor_nominal;
                        row.valor_categorica = row.valor_json.valor_categorica;
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
                        ...('regiao_id' in row && regioesDb
                            ? this.convertRowsRegiao(regioesDb, row as RetornoDbRegiao)
                            : {}),
                    };

                    // Push the item as an object
                    stream.push(item);
                }
            }

            // Mark the end of the stream
            stream.push(null);
        } catch (error) {
            this.logger.error(`Error in streamRowsInto: ${error}`);

            // Make sure we end the stream on error
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
}
