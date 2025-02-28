import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma, Regiao } from '@prisma/client';
import { DateTime } from 'luxon';
import { Readable } from 'stream';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { Date2YMD } from '../../common/date2ymd';
import { EmitErrorAndDestroyStream, Stream2PromiseIntoArray } from '../../common/helpers/Streaming';
import { PrismaService } from '../../prisma/prisma.service';
import { RegiaoBasica as RegiaoDto } from '../../regiao/entities/regiao.entity';
import { ReportContext } from '../relatorios/helpers/reports.contexto';
import { DefaultCsvOptions, FileOutput, ReportableService, UtilsService } from '../utils/utils.service';
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

const {
    Parser,
    transforms: { flatten },
} = require('json2csv');
const defaultTransform = [flatten({ paths: [] })];

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

        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
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
        });
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
        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
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
        });
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

        // no atual momento, tudo aqui é uma reimplementação completa do método asJSON
        // porém, desta nova forma é possível gerar arquivos CSV a partir dos dados do streaming
        // sem a necessidade de armazenar todos os dados em memória duma vez
        this.logger.verbose(`Gerando arquivos CSV para ${JSON.stringify(params)}`);
        const indicadores = await this.filtraIndicadores(params, user);
        this.logger.verbose(`Indicadores encontrados: ${indicadores.length}`);

        await ctx.progress(1);

        let linhas: RelIndicadoresDto[] = [];

        this.logger.debug(`Iniciando query de dados`);
        const linhasDataStream = new Readable({ objectMode: true, read() {} });
        await Promise.all([
            this.queryData(
                indicadores.map((r) => r.id),
                params,
                linhasDataStream
            ),
            Stream2PromiseIntoArray(linhasDataStream, linhas),
        ]);
        this.logger.debug(`Query de dados finalizada`);

        const pdm = await this.prisma.pdm.findUniqueOrThrow({ where: { id: params.pdm_id } });
        const out: FileOutput[] = [];

        this.logger.debug(`Iniciando geração de arquivos CSV`);
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

        this.logger.debug(`Gerando CSV de indicadores`);
        if (linhas.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
                fields: [
                    ...camposMetaIniAtv,
                    { value: 'data_referencia', label: 'Data de Referência' },
                    'serie',
                    'data',
                    'valor',
                ],
            });
            const linhasBuff = json2csvParser.parse(linhas);
            this.logger.debug(`CSV de indicadores gerado`);
            out.push({
                name: 'indicadores.csv',
                buffer: Buffer.from(linhasBuff, 'utf8'),
            });

            linhas = [];
        }
        await ctx.progress(50);

        this.logger.debug(`Iniciando geração de CSV de regiões`);
        let regioes: RelIndicadoresVariaveisDto[] = [];
        const regioesDataStream = new Readable({ objectMode: true, read() {} });
        this.logger.debug(`Iniciando query de dados de regiões`);

        await Promise.all([
            this.queryDataRegiao(
                indicadores.map((r) => r.id),
                params,
                regioesDataStream
            ),
            Stream2PromiseIntoArray(regioesDataStream, regioes),
        ]);
        this.logger.debug(`Query de dados de regiões finalizada`);

        this.logger.debug(`Gerando CSV de regiões`);
        if (regioes.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
                fields: [
                    ...camposMetaIniAtv,
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
                    { value: 'data_referencia', label: 'Data de Referência' },

                    'serie',
                    'data',
                    'valor',
                    { value: 'valor_categorica', label: 'Valor Categórica' },
                ],
            });
            const linhasBuff = json2csvParser.parse(regioes);
            this.logger.debug(`CSV de regiões gerado`);
            out.push({
                name: 'regioes.csv',
                buffer: Buffer.from(linhasBuff, 'utf8'),
            });
            regioes = [];
        }
        this.logger.debug(`CSVs gerados`);

        await ctx.progress(99);
        return [
            {
                name: 'info.json',
                buffer: Buffer.from(
                    JSON.stringify({
                        params: params,
                        horario: Date2YMD.tzSp2UTC(new Date()),
                    }),
                    'utf8'
                ),
            },
            ...out,
        ];
    }

    private async streamRowsInto(regioesDb: Regiao[] | null, stream: Readable, prismaTxn: Prisma.TransactionClient) {
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

                stream.push({
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
                    ...('regiao_id' in row && regioesDb ? this.convertRowsRegiao(regioesDb, row) : {}),
                });
            }
        }

        stream.push(null);
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
