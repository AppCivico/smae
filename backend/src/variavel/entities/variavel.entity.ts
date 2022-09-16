import { Periodicidade, Serie } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime"
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

export type SerieValorNomimal = {
    valor_nomimal: Decimal,
    data_valor: Date
    referencia: string
};

export type SerieValores = Record<Serie, SerieValorNomimal[]>

export class SerieValorPorPeriodo {
    [ano: string]: SerieValores;
}

