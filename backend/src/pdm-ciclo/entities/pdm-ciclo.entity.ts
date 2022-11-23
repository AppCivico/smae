import { DateYMD } from "src/common/date2ymd";
import { CicloFisicoDto } from "src/pdm/dto/list-pdm.dto";

export class ListPdmCicloDto {
    linhas: CicloFisicoDto[]
}

export class CicloFisicoV2Dto {
    id: number
    data_ciclo: DateYMD
    inicio_coleta: DateYMD
    inicio_qualificacao: DateYMD
    inicio_analise_risco: DateYMD
    inicio_fechamento: DateYMD
    fechamento: DateYMD
    pode_editar: boolean
    ativo: boolean
}

export class ListPdmCicloV2Dto {
    linhas: CicloFisicoV2Dto[]
}