import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Regiao } from '@prisma/client';
import { Date2YMD } from '../../common/date2ymd';
import { PrismaService } from '../../prisma/prisma.service';
import { RegiaoBasica as RegiaoDto } from '../../regiao/entities/regiao.entity';
import { DefaultCsvOptions, FileOutput, ReportableService, UtilsService } from '../utils/utils.service';
import { CreateRelIndicadorDto } from './dto/create-indicadore.dto';
import { ListIndicadoresDto, RelIndicadoresDto, RelIndicadoresVariaveisDto } from './entities/indicadores.entity';

class RetornoDb {
    data: string;
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
}

class RetornoDbRegiao extends RetornoDb {
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
    constructor(private readonly prisma: PrismaService, private readonly utils: UtilsService) {}

    async create(dto: CreateRelIndicadorDto): Promise<ListIndicadoresDto> {
        if (dto.periodo == 'Semestral' && !dto.semestre) {
            throw new HttpException('Necessário enviar semestre para o periodo Semestral', 400);
        }
        const { metas, iniciativas, atividades } = await this.utils.applyFilter(dto, {
            iniciativas: true,
            atividades: true,
        });

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

        const out: RelIndicadoresDto[] = [];
        const out_regioes: RelIndicadoresVariaveisDto[] = [];

        await this.queryData(
            indicadores.map((r) => r.id),
            dto,
            out
        );
        await this.queryDataRegiao(
            indicadores.map((r) => r.id),
            dto,
            out_regioes
        );

        return {
            linhas: out,
            regioes: out_regioes,
        };
    }

    private async queryData(indicadoresOrVar: number[], dto: CreateRelIndicadorDto, out: RelIndicadoresDto[]) {
        if (indicadoresOrVar.length == 0) return;

        const queryFromWhere = `indicador i ON i.id IN (${indicadoresOrVar.join(',')})
        left join meta on meta.id = i.meta_id
        left join iniciativa on iniciativa.id = i.iniciativa_id
        left join atividade on atividade.id = i.atividade_id
        left join iniciativa i2 on i2.id = atividade.iniciativa_id
        left join meta m2 on m2.id = iniciativa.meta_id OR m2.id = i2.meta_id`;

        const buscaInicio: { min: Date }[] = await this.prisma.$queryRawUnsafe(`SELECT min(si.data_valor::date)
        FROM (select 'Realizado'::"Serie" as serie UNION ALL select 'RealizadoAcumulado'::"Serie" as serie ) series
        JOIN serie_indicador si ON si.serie = series.serie
        JOIN ${queryFromWhere} and si.indicador_id = i.id`);

        const anoInicio = buscaInicio[0].min.getFullYear();

        const sql = `SELECT
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
        from generate_series($1::date, $2::date :OFFSET:, $3::interval) dt
        cross join (select 'Realizado'::"Serie" as serie UNION ALL select 'RealizadoAcumulado'::"Serie" as serie ) series
        join ${queryFromWhere}
        `;

        if (dto.periodo == 'Anual' && dto.tipo == 'Analitico') {
            const data: RetornoDb[] = await this.prisma.$queryRawUnsafe(
                sql
                    .replace(':JANELA:', "extract('month' from periodicidade_intervalo(i.periodicidade))::int")
                    .replace(':DATA:', 'dt.dt::date::text')
                    .replace(':OFFSET:', ''),
                anoInicio + '-01-01',
                dto.ano + 1 + '-01-01',
                '1 month'
            );

            out.push(...this.convertRows(data, null));
        } else if (dto.periodo == 'Anual' && dto.tipo == 'Consolidado') {
            const data: RetornoDb[] = await this.prisma.$queryRawUnsafe(
                sql.replace(':JANELA:', '12').replace(':DATA:', 'dt.dt::date::text').replace(':OFFSET:', ''),
                anoInicio + '-12-01',
                dto.ano + 1 + '-12-01',
                '1 year'
            );

            out.push(...this.convertRows(data, null));
        } else if (dto.periodo == 'Semestral' && dto.tipo == 'Consolidado') {
            const base_ano = dto.semestre == 'Primeiro' ? anoInicio : anoInicio - 1;
            const base_mes = dto.semestre == 'Primeiro' ? base_ano + '-06-01' : base_ano + '-12-01';

            const base_data: RetornoDb[] = await this.prisma.$queryRawUnsafe(
                sql
                    .replace(':JANELA:', '6')
                    .replace(':DATA:', "(dt.dt::date - '5 months'::interval)::date::text || '/' || (dt.dt::date)")
                    .replace(':OFFSET:', ''),
                base_mes,
                base_mes,
                '1 decade'
            );

            out.push(...this.convertRows(base_data, null));
        } else if (dto.periodo == 'Semestral' && dto.tipo == 'Analitico') {
            // indo buscar 6 meses, por isso sempre tem valor
            const base_data: RetornoDb[] = await this.prisma.$queryRawUnsafe(
                sql
                    .replace(':JANELA:', '6')
                    .replace(':DATA:', "(dt.dt::date - '5 months'::interval)::date::text")
                    .replace(':OFFSET:', "- '1 month'::interval"),
                dto.semestre == 'Primeiro' ? anoInicio + '-06-01' : anoInicio + '-12-01',
                dto.semestre == 'Primeiro' ? dto.ano + '-12-01' : dto.ano + 1 + '-06-01',
                '1 month'
            );
            out.push(...this.convertRows(base_data, null));
        }
    }

    private async queryDataRegiao(
        indicadoresOrVar: number[],
        dto: CreateRelIndicadorDto,
        out: RelIndicadoresVariaveisDto[]
    ) {
        if (indicadoresOrVar.length == 0) return;

        const queryFromWhere = `indicador i ON i.id IN (${indicadoresOrVar.join(',')})
        join indicador_variavel iv ON iv.indicador_id = i.id
        join variavel v ON v.id = iv.variavel_id
        left join meta on meta.id = i.meta_id
        left join iniciativa on iniciativa.id = i.iniciativa_id
        left join atividade on atividade.id = i.atividade_id
        left join iniciativa i2 on i2.id = atividade.iniciativa_id
        left join meta m2 on m2.id = iniciativa.meta_id OR m2.id = i2.meta_id
        where v.regiao_id is not null`;

        const buscaInicio: { min: Date }[] = await this.prisma.$queryRawUnsafe(`SELECT min(sv.data_valor::date)
        FROM (select 'Realizado'::"Serie" as serie UNION ALL select 'RealizadoAcumulado'::"Serie" as serie ) series
        JOIN serie_variavel sv ON sv.serie = series.serie
        JOIN ${queryFromWhere} and sv.variavel_id = v.id`);

        const anoInicio = buscaInicio[0].min.getFullYear();

        const sql = `SELECT
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
        series.serie,
        v.id as variavel_id,
        v.codigo as variavel_codigo,
        v.titulo as variavel_titulo,
        v.regiao_id as regiao_id,
        round(
            valor_variavel_em(
                v.id,
                series.serie,
                dt.dt::date,
                :JANELA:
            ),
            v.casas_decimais
        )::text as valor
        from generate_series($1::date, $2::date :OFFSET:, $3::interval) dt
        cross join (select 'Realizado'::"Serie" as serie UNION ALL select 'RealizadoAcumulado'::"Serie" as serie ) series
        join ${queryFromWhere}
        `;

        const regioes = await this.prisma.regiao.findMany({
            where: { removido_em: null },
        });

        if (dto.periodo == 'Anual' && dto.tipo == 'Analitico') {
            const data: RetornoDbRegiao[] = await this.prisma.$queryRawUnsafe(
                sql
                    .replace(':JANELA:', "extract('month' from periodicidade_intervalo(v.periodicidade))::int")
                    .replace(':DATA:', 'dt.dt::date::text')
                    .replace(':OFFSET:', ''),
                anoInicio + '-01-01',
                dto.ano + 1 + '-01-01',
                '1 month'
            );

            out.push(...(this.convertRows(data, regioes) as RelIndicadoresVariaveisDto[]));
        } else if (dto.periodo == 'Anual' && dto.tipo == 'Consolidado') {
            const data: RetornoDbRegiao[] = await this.prisma.$queryRawUnsafe(
                sql.replace(':JANELA:', '12').replace(':DATA:', 'dt.dt::date::text').replace(':OFFSET:', ''),
                anoInicio + '-12-01',
                dto.ano + 1 + '-12-01',
                '1 year'
            );

            out.push(...(this.convertRows(data, regioes) as RelIndicadoresVariaveisDto[]));
        } else if (dto.periodo == 'Semestral' && dto.tipo == 'Consolidado') {
            const base_ano = dto.semestre == 'Primeiro' ? anoInicio : anoInicio - 1;
            const base_mes = dto.semestre == 'Primeiro' ? base_ano + '-06-01' : base_ano + '-12-01';

            const base_data: RetornoDbRegiao[] = await this.prisma.$queryRawUnsafe(
                sql
                    .replace(':JANELA:', '6')
                    .replace(':DATA:', "(dt.dt::date - '5 months'::interval)::date::text || '/' || (dt.dt::date)")
                    .replace(':OFFSET:', ''),
                base_mes,
                base_mes,
                '1 decade'
            );

            out.push(...(this.convertRows(base_data, regioes) as RelIndicadoresVariaveisDto[]));
        } else if (dto.periodo == 'Semestral' && dto.tipo == 'Analitico') {
            // indo buscar 6 meses, por isso sempre tem valor
            const base_data: RetornoDbRegiao[] = await this.prisma.$queryRawUnsafe(
                sql
                    .replace(':JANELA:', '6')
                    .replace(':DATA:', "(dt.dt::date - '5 months'::interval)::date::text")
                    .replace(':OFFSET:', "- '1 month'::interval"),
                dto.semestre == 'Primeiro' ? anoInicio + '-06-01' : anoInicio + '-12-01',
                dto.semestre == 'Primeiro' ? dto.ano + '-12-01' : dto.ano + 1 + '-06-01',
                '1 month'
            );
            out.push(...(this.convertRows(base_data, regioes) as RelIndicadoresVariaveisDto[]));
        }
    }

    async getFiles(myInput: any, pdm_id: number, params: any): Promise<FileOutput[]> {
        const dados = myInput as ListIndicadoresDto;
        const pdm = await this.prisma.pdm.findUniqueOrThrow({ where: { id: pdm_id } });
        const out: FileOutput[] = [];

        const camposMetaIniAtv = [
            { value: 'meta.codigo', label: 'Código da Meta' },
            { value: 'meta.titulo', label: 'Título da Meta' },
            { value: 'meta.id', label: 'ID da Meta' },
            {
                value: (row: RetornoDb) => {
                    if (!row.meta_tags || !Array.isArray(row.meta_tags)) return '';
                    return row.meta_tags.map((t) => t.descricao).join('\n');
                },
                label: 'Meta Tags',
            },
            {
                value: (row: RetornoDb) => {
                    if (!row.meta_tags || !Array.isArray(row.meta_tags)) return '';
                    return row.meta_tags.map((t) => t.id).join(', ');
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

        if (dados.linhas.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
                fields: [...camposMetaIniAtv, 'serie', 'data', 'valor'],
            });
            const linhas = json2csvParser.parse(dados.linhas);
            out.push({
                name: 'indicadores.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }

        if (dados.regioes.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
                fields: [
                    ...camposMetaIniAtv,

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

                    'serie',
                    'data',
                    'valor',
                ],
            });
            const linhas = json2csvParser.parse(dados.regioes);
            out.push({
                name: 'regioes.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }

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

    private convertRows(
        input: RetornoDb[] | RetornoDbRegiao[],
        regioesDb: Regiao[] | null
    ): RelIndicadoresDto[] | RelIndicadoresVariaveisDto[] {
        return input.map((db) => {
            return {
                indicador: {
                    codigo: db.indicador_codigo,
                    titulo: db.indicador_titulo,
                    contexto: db.indicador_contexto,
                    complemento: db.indicador_complemento,
                    id: +db.indicador_id,
                },
                meta: db.meta_id ? { codigo: db.meta_codigo, titulo: db.meta_titulo, id: +db.meta_id } : null,
                meta_tags: db.meta_tags ? db.meta_tags : null,
                iniciativa: db.iniciativa_id
                    ? { codigo: db.iniciativa_codigo, titulo: db.iniciativa_titulo, id: +db.iniciativa_id }
                    : null,
                atividade: db.atividade_id
                    ? { codigo: db.atividade_codigo, titulo: db.atividade_titulo, id: +db.atividade_id }
                    : null,

                data: db.data,
                serie: db.serie,
                valor: db.valor,

                variavel: db.variavel_id
                    ? { codigo: db.variavel_codigo, titulo: db.variavel_titulo, id: +db.variavel_id }
                    : undefined,
                ...('regiao_id' in db && regioesDb ? this.convertRowsRegiao(regioesDb, db) : {}),
            };
        });
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
