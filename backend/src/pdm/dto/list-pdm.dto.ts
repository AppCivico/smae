import { CicloFase } from "@prisma/client";
import { DateYMD } from "src/common/date2ymd";
import { ListPdm } from "src/pdm/entities/list-pdm.entity";

export class CicloFisicoFase {
    id: number
    data_inicio: DateYMD
    data_fim: DateYMD
    ciclo_fase: CicloFase
    fase_corrente: boolean
}

export class CicloFisicoDto {
    id: number
    data_ciclo: DateYMD
    ativo: boolean
    fases: CicloFisicoFase[]
}


export class OrcamentoConfig {
    ano_referencia: number
    pdm_id: number
    previsao_custo_disponivel: boolean
    planejado_disponivel: boolean
    execucao_disponivel: boolean
}


export class ListPdmDto {
    linhas: ListPdm[]
    ciclo_fisico_ativo?: CicloFisicoDto | null
    orcamento_config?: OrcamentoConfig[] | null
}
