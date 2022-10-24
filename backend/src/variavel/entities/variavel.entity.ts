import { ApiExtraModels, ApiHideProperty, ApiOkResponse, ApiProperty, OmitType, PartialType, refs } from "@nestjs/swagger"
import { Periodicidade, Prisma, Serie, VariavelResponsavel } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime"
import { IsString } from "class-validator"
import { DateYMD } from "src/common/date2ymd"
import { OrgaoResumo } from "src/orgao/entities/orgao.entity"
import { Pessoa } from "src/pessoa/entities/pessoa.entity"
import { Regiao } from "src/regiao/entities/regiao.entity"
import { UnidadeMedida } from "src/unidade-medida/entities/unidade-medida.entity"

export class IdTitulo {
    id: number
    titulo: string
}

export class IndicadorVariavel {
    desativado: boolean;
    indicador: {
        id: number;
        titulo: string;
        meta: IdTitulo | null;
        iniciativa: IdTitulo | null;
        atividade: IdTitulo | null;
    };
    indicador_origem: {
        id: number;
        titulo: string;
        meta: IdTitulo | null;
        iniciativa: IdTitulo | null;
        atividade: IdTitulo | null;
    } | null
}

export class IdNomeExibicao {
    id: number
    nome_exibicao: string
}

export class Variavel {
    id: number
    titulo: string
    acumulativa: boolean
    unidade_medida: UnidadeMedida
    casas_decimais: number
    /**
     * numérico, vem string pra não perder precisão durante o encoding do JSON
    */
    valor_base: Decimal
    @ApiProperty({ type: String })
    periodicidade: Periodicidade
    orgao: OrgaoResumo
    regiao: Regiao | null
    indicador_variavel: IndicadorVariavel[]
    responsaveis?: IdNomeExibicao[]
    ano_base?: number | null
    codigo: string
}

export class SerieValorNomimal {
    /**
     * valor da serie lida
     * @example "880.12359876352"
     */
    @IsString()
    valor_nominal: string

    /**
     * token para editar/criar este valor
     * @example "token.nao-tao-grande.assim"
     */
    referencia: string

    /**
     * referencia em data para usar caso não seja um humano consumindo a api
     * @example "2023-01-01"
     */
    data_valor: DateYMD
};

export type SerieIndicadorValorNomimal = Record<Serie, SerieValorNomimal | undefined>

export class SerieValorPorPeriodo {
    [periodo: DateYMD]: SerieIndicadorValorNomimal;
}

export class SerieIndicadorValorNominal extends OmitType(SerieValorNomimal, ['referencia'] as const) { }

export class SeriesAgrupadas {
    /**
     * categoria do batch
     * @example "2020"
     */
    agrupador: string

    /**
     * "Fevereiro 2021"
     * @example "Fevereiro 2021"
     */
    periodo: string

    @ApiProperty({
        type: 'array',
        allOf: [
            {
                type: 'array',
                items: {
                    oneOf: refs(SerieValorNomimal, SerieIndicadorValorNominal)
                }
            }
        ],
    })
    series: SerieValorNomimal[] | SerieIndicadorValorNominal[]
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
}

export class Iniciativa {
    id: number
    meta_id: number
    codigo: string
    titulo: string
}

export class Atividade {
    id: number
    iniciativa_id: number
    codigo: string
    titulo: string
}