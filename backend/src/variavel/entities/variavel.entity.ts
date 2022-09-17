import { Periodicidade, Prisma, Serie } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime"
import { IsString } from "class-validator"
import { DateYMD } from "src/common/date2ymd"
import { OrgaoResumo } from "src/orgao/entities/orgao.entity"
import { Regiao } from "src/regiao/entities/regiao.entity"
import { UnidadeMedida } from "src/unidade-medida/entities/unidade-medida.entity"

export class IndicadorVariavel {
    desativado: boolean;
    indicador: {
        id: number;
        titulo: string;
        meta_id: number;
    };
    // TODO...
    iniciativa?: {}
    ativiadade?: {}
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
    periodicidade: Periodicidade
    peso: number | null
    orgao: OrgaoResumo
    regiao: Regiao | null
    indicador_variavel: IndicadorVariavel[]

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

export type SerieValores = Record<Serie, SerieValorNomimal | undefined>

export class SerieValorPorPeriodo {
    [periodo: DateYMD]: SerieValores;
}

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

    series: SerieValorNomimal[]
}

export class ValorSerieExistente {
    id: number;
    valor_nominal: Decimal;
    data_valor: Date;
    serie: Serie;
}