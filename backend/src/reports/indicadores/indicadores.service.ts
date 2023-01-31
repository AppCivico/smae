import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Date2YMD } from '../../common/date2ymd';
import { PrismaService } from '../../prisma/prisma.service';

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

    regiao_id?: number;
    regiao_descricao?: string;
    regiao_nivel?: number;
    regiao_codigo?: number;
    regiao_pai_id?: number;
    regiao_pai_descricao?: string;
    regiao_pai_codigo?: number;
    regiao_pai_nivel?: number;

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
        const { metas, iniciativas, atividades } = await this.utils.applyFilter(dto, { iniciativas: true, atividades: true });

        const indicadores = await this.prisma.indicador.findMany({
            where: {
                removido_em: null,
                OR: [{ meta_id: { in: metas.map(r => r.id) } }, { iniciativa_id: { in: iniciativas.map(r => r.id) } }, { atividade_id: { in: atividades.map(r => r.id) } }],
            },
            select: { id: true },
        });

        const out: RelIndicadoresDto[] = [];
        const out_regioes: RelIndicadoresVariaveisDto[] = [];

        await this.queryData(
            indicadores.map(r => r.id),
            dto,
            out,
        );
        await this.queryDataRegiao(
            indicadores.map(r => r.id),
            dto,
            out_regioes,
        );

        return {
            linhas: out,
            regioes: out_regioes,
        };
    }

    private async queryData(indicadoresOrVar: number[], dto: CreateRelIndicadorDto, out: RelIndicadoresDto[]) {
        if (indicadoresOrVar.length == 0) return;

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
        join indicador i ON i.id IN (${indicadoresOrVar.join(',')})
        left join meta on meta.id = i.meta_id
        left join iniciativa on iniciativa.id = i.iniciativa_id
        left join atividade on atividade.id = i.atividade_id
        left join iniciativa i2 on i2.id = atividade.iniciativa_id
        left join meta m2 on m2.id = iniciativa.meta_id OR m2.id = i2.meta_id
        `;

        if (dto.periodo == 'Anual' && dto.tipo == 'Analitico') {
            const data: RetornoDb[] = await this.prisma.$queryRawUnsafe(
                sql.replace(':JANELA:', "extract('month' from periodicidade_intervalo(i.periodicidade))::int").replace(':DATA:', 'dt.dt::date::text').replace(':OFFSET:', ''),
                dto.ano + '-01-01',
                dto.ano + 1 + '-01-01',
                '1 month',
            );

            out.push(...this.convertRows(data));
        } else if (dto.periodo == 'Anual' && dto.tipo == 'Consolidado') {
            const data: RetornoDb[] = await this.prisma.$queryRawUnsafe(
                sql.replace(':JANELA:', '12').replace(':DATA:', 'dt.dt::date::text').replace(':OFFSET:', ''),
                dto.ano + '-12-01',
                dto.ano + 1 + '-12-01',
                '1 year',
            );

            out.push(...this.convertRows(data));
        } else if (dto.periodo == 'Semestral' && dto.tipo == 'Consolidado') {
            const base_ano = dto.semestre == 'Primeiro' ? dto.ano : dto.ano - 1;
            const base_mes = dto.semestre == 'Primeiro' ? base_ano + '-06-01' : base_ano + '-12-01';

            const base_data: RetornoDb[] = await this.prisma.$queryRawUnsafe(
                sql.replace(':JANELA:', '6').replace(':DATA:', "(dt.dt::date - '5 months'::interval)::date::text || '/' || (dt.dt::date)").replace(':OFFSET:', ''),
                base_mes,
                base_mes,
                '1 decade',
            );

            const complemento_ano = dto.semestre == 'Primeiro' ? dto.ano : dto.ano + 1;
            const complemento_mes = dto.semestre == 'Primeiro' ? complemento_ano + '-12-01' : complemento_ano + '-06-01';

            const complemento_data: RetornoDb[] = await this.prisma.$queryRawUnsafe(
                sql.replace(':JANELA:', '6').replace(':DATA:', "(dt.dt::date - '5 months'::interval)::date::text || '/' || (dt.dt::date)").replace(':OFFSET:', ''),
                complemento_mes,
                complemento_mes,
                '1 decade',
            );

            out.push(...this.convertRows(base_data));
            out.push(...this.convertRows(complemento_data));
        } else if (dto.periodo == 'Semestral' && dto.tipo == 'Analitico') {
            // indo buscar 6 meses, por isso sempre tem valor
            const base_data: RetornoDb[] = await this.prisma.$queryRawUnsafe(
                sql.replace(':JANELA:', '6').replace(':DATA:', "(dt.dt::date - '5 months'::interval)::date::text").replace(':OFFSET:', "- '1 month'::interval"),
                dto.semestre == 'Primeiro' ? dto.ano + '-06-01' : dto.ano + '-12-01',
                dto.semestre == 'Primeiro' ? dto.ano + '-12-01' : dto.ano + 1 + '-06-01',
                '1 month',
            );
            out.push(...this.convertRows(base_data));
        }
    }

    private async queryDataRegiao(indicadoresOrVar: number[], dto: CreateRelIndicadorDto, out: RelIndicadoresVariaveisDto[]) {
        if (indicadoresOrVar.length == 0) return;

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
        r.id as regiao_id,
        r.codigo as regiao_codigo,
        r.descricao as regiao_descricao,
        r.nivel as regiao_nivel,
        r_parent.id as regiao_pai_id,
        r_parent.codigo as regiao_pai_codigo,
        r_parent.descricao as regiao_pai_descricao,
        r_parent.nivel as regiao_pai_nivel,
        round(
            valor_variavel_em(
                v.id,
                series.serie,
                dt.dt::date,
                :JANELA:
            ),
            i.casas_decimais
        )::text as valor
        from generate_series($1::date, $2::date :OFFSET:, $3::interval) dt
        cross join (select 'Realizado'::"Serie" as serie UNION ALL select 'RealizadoAcumulado'::"Serie" as serie ) series
        join indicador i ON i.id IN (${indicadoresOrVar.join(',')})
        join indicador_variavel iv ON iv.indicador_id = i.id
        join variavel v ON v.id = iv.variavel_id
        join regiao r ON v.regiao_id = r.id
        join regiao r_parent ON r.parente_id = r_parent.id
        left join meta on meta.id = i.meta_id
        left join iniciativa on iniciativa.id = i.iniciativa_id
        left join atividade on atividade.id = i.atividade_id
        left join iniciativa i2 on i2.id = atividade.iniciativa_id
        left join meta m2 on m2.id = iniciativa.meta_id OR m2.id = i2.meta_id
        where v.regiao_id is not null
        `;

        if (dto.periodo == 'Anual' && dto.tipo == 'Analitico') {
            const data: RetornoDb[] = await this.prisma.$queryRawUnsafe(
                sql.replace(':JANELA:', "extract('month' from periodicidade_intervalo(v.periodicidade))::int").replace(':DATA:', 'dt.dt::date::text').replace(':OFFSET:', ''),
                dto.ano + '-01-01',
                dto.ano + 1 + '-01-01',
                '1 month',
            );

            out.push(...this.convertRows(data));
        } else if (dto.periodo == 'Anual' && dto.tipo == 'Consolidado') {
            const data: RetornoDb[] = await this.prisma.$queryRawUnsafe(
                sql.replace(':JANELA:', '12').replace(':DATA:', 'dt.dt::date::text').replace(':OFFSET:', ''),
                dto.ano + '-12-01',
                dto.ano + 1 + '-12-01',
                '1 year',
            );

            out.push(...this.convertRows(data));
        } else if (dto.periodo == 'Semestral' && dto.tipo == 'Consolidado') {
            const base_ano = dto.semestre == 'Primeiro' ? dto.ano : dto.ano - 1;
            const base_mes = dto.semestre == 'Primeiro' ? base_ano + '-06-01' : base_ano + '-12-01';

            const base_data: RetornoDb[] = await this.prisma.$queryRawUnsafe(
                sql.replace(':JANELA:', '6').replace(':DATA:', "(dt.dt::date - '5 months'::interval)::date::text || '/' || (dt.dt::date)").replace(':OFFSET:', ''),
                base_mes,
                base_mes,
                '1 decade',
            );

            const complemento_ano = dto.semestre == 'Primeiro' ? dto.ano : dto.ano + 1;
            const complemento_mes = dto.semestre == 'Primeiro' ? complemento_ano + '-12-01' : complemento_ano + '-06-01';

            const complemento_data: RetornoDb[] = await this.prisma.$queryRawUnsafe(
                sql.replace(':JANELA:', '6').replace(':DATA:', "(dt.dt::date - '5 months'::interval)::date::text || '/' || (dt.dt::date)").replace(':OFFSET:', ''),
                complemento_mes,
                complemento_mes,
                '1 decade',
            );

            out.push(...this.convertRows(base_data));
            out.push(...this.convertRows(complemento_data));
        } else if (dto.periodo == 'Semestral' && dto.tipo == 'Analitico') {
            // indo buscar 6 meses, por isso sempre tem valor
            const base_data: RetornoDb[] = await this.prisma.$queryRawUnsafe(
                sql.replace(':JANELA:', '6').replace(':DATA:', "(dt.dt::date - '5 months'::interval)::date::text").replace(':OFFSET:', "- '1 month'::interval"),
                dto.semestre == 'Primeiro' ? dto.ano + '-06-01' : dto.ano + '-12-01',
                dto.semestre == 'Primeiro' ? dto.ano + '-12-01' : dto.ano + 1 + '-06-01',
                '1 month',
            );
            out.push(...this.convertRows(base_data));
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
                    return row.meta_tags.map(t => t.descricao).join('\n');
                },
                label: 'Meta Tags',
            },
            {
                value: (row: RetornoDb) => {
                    if (!row.meta_tags || !Array.isArray(row.meta_tags)) return '';
                    return row.meta_tags.map(t => t.id).join(', ');
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

                    { value: 'regiao.codigo', label: 'Código da Região' },
                    { value: 'regiao.descricao', label: 'Descrição da Região' },
                    { value: 'regiao.nivel', label: 'Nível da Região' },

                    { value: 'regiao.id', label: 'ID da Região' },
                    { value: 'regiao.parent.codigo', label: 'Código da Região Pai' },
                    { value: 'regiao.parent.descricao', label: 'Descrição da Região Pai' },
                    { value: 'regiao.parent.nivel', label: 'Nível da Região Pai' },
                    { value: 'regiao.parent.id', label: 'ID da Região Pai' },
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
                    'utf8',
                ),
            },
            ...out,
        ];
    }

    private convertRows(input: RetornoDb[]): RelIndicadoresDto[] | RelIndicadoresVariaveisDto[] {
        return input.map(db => {
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
                iniciativa: db.iniciativa_id ? { codigo: db.iniciativa_codigo, titulo: db.iniciativa_titulo, id: +db.iniciativa_id } : null,
                atividade: db.atividade_id ? { codigo: db.atividade_codigo, titulo: db.atividade_titulo, id: +db.atividade_id } : null,
                variavel: db.variavel_id ? { codigo: db.variavel_codigo, titulo: db.variavel_titulo, id: +db.variavel_id } : undefined,

                regiao: db.regiao_id
                    ? {
                          id: +db.regiao_id,
                          codigo: db.regiao_codigo,
                          descricao: db.regiao_descricao,
                          nivel: db.regiao_nivel,

                          parente: db.regiao_pai_id
                              ? {
                                    id: +db.regiao_pai_id,
                                    codigo: db.regiao_pai_codigo,
                                    descricao: db.regiao_pai_descricao,
                                    nivel: db.regiao_pai_nivel,
                                }
                              : undefined,
                      }
                    : undefined,

                data: db.data,
                serie: db.serie,
                valor: db.valor,
            };
        });
    }
}
