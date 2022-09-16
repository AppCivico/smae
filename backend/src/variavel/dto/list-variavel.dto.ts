import { SeriesAgrupadas, Variavel } from "src/variavel/entities/variavel.entity";

export class ListVariavelDto {
    linhas: Variavel[]
}

export class ListPrevistoAgrupadas {
    previsto: SeriesAgrupadas
    indicador: {
        id: number
        casas_decimais: number
    }
}

