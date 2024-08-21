import { ApiProperty, OmitType, PickType, refs } from '@nestjs/swagger';
import { Periodicidade, Polaridade, Serie } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { IsOptional, IsString } from 'class-validator';
import { DateYMD } from '../../common/date2ymd';
import { IdNomeDto } from '../../common/dto/IdNome.dto';
import { IdNomeExibicaoDto } from '../../common/dto/IdNomeExibicao.dto';
import { IdTituloDto } from '../../common/dto/IdTitulo.dto';
import { OrgaoResumo } from '../../orgao/entities/orgao.entity';
import { Regiao } from '../../regiao/entities/regiao.entity';
import { UnidadeMedida } from '../../unidade-medida/entities/unidade-medida.entity';
import { VariavelResumo } from '../dto/list-variavel.dto';
import { IsOnlyDate } from '../../common/decorators/IsDateOnly';
import { DateTransform } from '../../auth/transforms/date.transform';
import { Transform } from 'class-transformer';

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
    inicio_medicao: string | null;
    fim_medicao: string | null;
    suspendida: boolean;
    mostrar_monitoramento: boolean;
    variavel_categorica_id: number | null;
    etapa: IdTituloDto | null;
    possui_variaveis_filhas: boolean;
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
]) {
    orgao_proprietario: OrgaoResumo;
    fonte: IdNomeDto | null;
    planos: IdNomeDto[];
    pode_editar: boolean;
    pode_excluir: boolean;
}

export class FilterSVNPeriodoDto {
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
}

export class SACicloFisicoDto {
    id: number;
    analise: string;
    tem_documentos: boolean;
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
    data_valor: DateYMD;

    /**
     * Apenas em indicadores
     **/
    ha_conferencia_pendente?: boolean;
    /**
     * Apenas em variaveis
     **/
    conferida?: boolean;
}

export type SerieIndicadorValorNomimal = Record<Serie, SerieValorNomimal | undefined>;

export class SerieValorPorPeriodo {
    [periodo: DateYMD]: SerieIndicadorValorNomimal;
}

export class SerieIndicadorValorNominal extends OmitType(SerieValorNomimal, ['referencia'] as const) {}

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
        allOf: [
            {
                type: 'array',
                items: {
                    oneOf: refs(SerieValorNomimal, SerieIndicadorValorNominal),
                },
            },
        ],
    })
    series: SerieValorNomimal[] | SerieIndicadorValorNominal[];
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
