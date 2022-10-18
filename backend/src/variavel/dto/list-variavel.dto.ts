import { Periodicidade, Serie } from "@prisma/client";
import { SeriesAgrupadas, Variavel } from "src/variavel/entities/variavel.entity";

export class ListVariavelDto {
    linhas: Variavel[]
}

export class VariavelResumo {
    /***
     * qual o ID do variavel está associada
     * @example "1"
    */
    id: number
    /***
     * quantas cadas decimais são esperadas no envio/retorno
     * @example "11"
    */
    casas_decimais: number
    periodicidade: Periodicidade
}

export class ListPrevistoAgrupadas {
    linhas: SeriesAgrupadas[]
    variavel: VariavelResumo
    /**
     * contextualiza qual a ordem que as séries serão apresentadas dentro de SeriesAgrupadas
     * @example "["Previsto", "PrevistoAcumulado", "Realizado", "RealizadoAcumulado"]"
    */
    ordem_series: Serie[]
}

