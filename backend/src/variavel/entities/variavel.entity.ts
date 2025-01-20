import { ApiProperty, getSchemaPath, OmitType, PickType, refs } from '@nestjs/swagger';
import { Periodicidade, Polaridade, Prisma, Serie, TipoVariavel } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { DateTransform } from '../../auth/transforms/date.transform';
import { DateYMD } from '../../common/date2ymd';
import { IsOnlyDate } from '../../common/decorators/IsDateOnly';
import { IdNomeDto } from '../../common/dto/IdNome.dto';
import { IdNomeExibicaoDto } from '../../common/dto/IdNomeExibicao.dto';
import { IdTituloDto } from '../../common/dto/IdTitulo.dto';
import { OrgaoResumo } from '../../orgao/entities/orgao.entity';
import { Regiao } from '../../regiao/entities/regiao.entity';
import { UnidadeMedida } from '../../unidade-medida/entities/unidade-medida.entity';
import { VariavelResumo } from '../dto/list-variavel.dto';
import { IsDateYMD } from '../../auth/decorators/date.decorator';

export class IndicadorVariavelOrigemDto {
    id: number;
    titulo: string;
    meta: IdTituloDto | null;
    iniciativa: IdTituloDto | null;
    atividade: IdTituloDto | null;
}

export class IndicadorVariavelItemDto {
    desativado: boolean;
    indicador: IndicadorVariavelOrigemDto;
    indicador_origem: IndicadorVariavelOrigemDto | null;
    aviso_data_fim: boolean;
}

export class VariavelItemDto {
    id: number;
    titulo: string;
    acumulativa: boolean;
    unidade_medida: UnidadeMedida;
    casas_decimais: number;
    /**
     * numérico, vem string pra não perder precisão durante o encoding do JSON
     */
    valor_base: Decimal;
    @ApiProperty({ type: String })
    periodicidade: Periodicidade;
    orgao: OrgaoResumo;
    regiao: Regiao | null;
    polaridade: Polaridade;
    indicador_variavel: IndicadorVariavelItemDto[];
    responsaveis?: IdNomeExibicaoDto[];
    ano_base?: number | null;
    codigo: string;
    atraso_meses: number;
    @IsDateYMD({ nullable: true })
    inicio_medicao: string | null;
    @IsDateYMD({ nullable: true })
    fim_medicao: string | null;
    suspendida: boolean;
    supraregional: boolean;
    mostrar_monitoramento: boolean;
    variavel_categorica_id: number | null;
    etapa: IdTituloDto | null;
    possui_variaveis_filhas: boolean;

    recalculando: boolean;
    recalculo_erro: string | null;
    recalculo_tempo: Decimal | null;
    variavel_mae_id: number | null;
    // TODO mover fonte pra cá, ou criar novo detail para tipo global
}

export class VariavelGlobalItemDto extends PickType(VariavelItemDto, [
    'id',
    'titulo',
    'codigo',
    'periodicidade',
    'inicio_medicao',
    'fim_medicao',
    'orgao',
    'regiao',
    'possui_variaveis_filhas',
    'supraregional',
]) {
    orgao_proprietario: OrgaoResumo;
    tipo: TipoVariavel;
    fonte: IdNomeDto | null;
    planos: IdNomeDto[];
    pode_editar: boolean;
    pode_editar_valor: boolean;
    pode_excluir: boolean;
}

export class FilterPeriodoDto {
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    data_inicio?: Date;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    data_fim?: Date;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    data_valor?: Date;

    @IsOptional()
    @IsBoolean()
    @Transform((v) => v.value === 'true')
    ate_ciclo_corrente?: Boolean;
}

export const TipoUso = { 'leitura': 'leitura', 'escrita': 'escrita' } as const;
export type TipoUso = keyof typeof TipoUso;

export class FilterSVNPeriodoDto extends FilterPeriodoDto {
    @IsOptional()
    @IsEnum(Serie, { message: 'Serie inválida' })
    @ApiProperty({ enum: Serie, required: false })
    serie?: Serie;

    @IsOptional()
    @IsBoolean()
    @Transform((v) => v.value === 'true')
    incluir_auxiliares?: boolean;

    @IsOptional()
    @IsEnum(TipoUso, { message: 'Tipo de uso inválido' })
    @ApiProperty({ enum: TipoUso, required: false })
    uso?: TipoUso;
}

export class FilterVariavelDetalheDto {
    @IsOptional()
    @IsBoolean()
    @Transform((v) => v.value === 'true')
    incluir_auxiliares?: boolean;
}

export class SACicloFisicoDto {
    id: number;
    analise: string;
    tem_documentos: boolean;
    contagem_qualitativa?: number | null;
}

export class SerieValorNomimal {
    /**
     * valor da serie lida
     * @example "880.12359876352"
     */
    @IsString()
    valor_nominal: string;

    /**
     * token para editar/criar este valor
     * @example "token.nao-tao-grande.assim"
     */
    referencia: string;

    /**
     * referencia em data para usar caso não seja um humano consumindo a api
     * @example "2023-01-01"
     */
    @IsDateYMD()
    data_valor: DateYMD;

    /**
     * Apenas em indicadores
     **/
    ha_conferencia_pendente?: boolean;
    /**
     * Apenas em variaveis
     **/
    conferida?: boolean;

    elementos?: Prisma.JsonValue | null;
}

export type SerieIndicadorValorNomimal = Record<Serie, SerieValorNomimal | undefined>;

export class SerieValorPorPeriodo {
    [periodo: DateYMD]: SerieIndicadorValorNomimal;
}

export class SerieIndicadorValorNominal extends OmitType(SerieValorNomimal, ['referencia'] as const) {}

export class SerieValorCategoricaElemento {
    @IsString()
    categoria: string;

    @IsString()
    variavel_id: number;
}

export class SerieValorCategoricaComposta extends PickType(SerieValorNomimal, [
    'data_valor',
    'conferida',
    'valor_nominal',
] as const) {
    @ApiProperty({
        type: 'array',
        items: { $ref: getSchemaPath(SerieValorCategoricaElemento) },
    })
    elementos: SerieValorCategoricaElemento[];
}

export class SeriesAgrupadas {
    /**
     * categoria do batch
     * @example "2020"
     */
    agrupador: string;

    /**
     * "Fevereiro 2021"
     * @example "Fevereiro 2021"
     */
    periodo: string;

    /**
     * opcional - volta no get formula serie da formula composta
     */
    variavel?: VariavelResumo;

    /**
     * ciclo fisico
     * opcional - não volta na serie de indicadores
     */
    ciclo_fisico?: SACicloFisicoDto;

    @ApiProperty({
        type: 'array',
        oneOf: refs(SerieValorNomimal, SerieIndicadorValorNominal, SerieValorCategoricaComposta),
        description:
            'Array de series: \n' +
            '- `SerieIndicadorValorNominal`: valor nominal de uma série de indicador ou variável apenas de leitura\n' +
            '- `SerieValorNomimal`: valor comum com referencia.\n' +
            '- `SerieValorCategoricaComposta`: valor com elementos de uma variável categórica\n',
    })
    series: SerieValorNomimal[] | SerieIndicadorValorNominal[] | SerieValorCategoricaComposta[];
}

export type SerieIndicadorValores = Record<Serie, SerieIndicadorValorNominal | undefined>;

export class SerieIndicadorValorPorPeriodo {
    [periodo: DateYMD]: SerieIndicadorValores;
}

export class ValorSerieExistente {
    id: number;
    valor_nominal: Decimal | number;
    data_valor: Date;
    serie: Serie;
    /**
     * Apenas em indicadores
     **/
    ha_conferencia_pendente?: boolean;
    /**
     * Apenas em variaveis
     **/
    conferida?: boolean;
    elementos?: Prisma.JsonValue | null;
}

export class Iniciativa {
    id: number;
    meta_id: number;
    codigo: string;
    titulo: string;
}

export class Atividade {
    id: number;
    iniciativa_id: number;
    codigo: string;
    titulo: string;
}
