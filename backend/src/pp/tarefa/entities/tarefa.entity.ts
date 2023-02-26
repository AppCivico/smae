import { IdSiglaDescricao } from "../../../common/dto/IdSigla.dto"
import { TarefaDependenciaDto } from "../dto/create-tarefa.dto"

export class TarefaItemDto {
    id: number
    orgao: IdSiglaDescricao
    nivel: number
    numero: number
    tarefa_pai_id: number | null
    tarefa: string

    inicio_planejado: Date | null
    termino_planejado: Date | null
    duracao_planejado: number | null

    inicio_real: Date | null
    termino_real: Date | null
    duracao_real: number | null

    custo_estimado: number | null
    custo_real: number | null

    n_filhos_imediatos: number

    percentual_concluido: number | null

    atraso: number | null
}

export class TarefaDetailDto extends TarefaItemDto {
    inicio_planejado_calculado: boolean
    termino_planejado_calculado: boolean
    duracao_planejado_calculado: boolean

    descricao: string
    recursos: string

    dependencias: TarefaDependenciaDto[]
}

export class ListTarefaDto {
    linhas: TarefaItemDto[]
}

export class DependenciasDatasDto {
    inicio_planejado_calculado: boolean
    termino_planejado_calculado: boolean
    duracao_planejado_calculado: boolean

    inicio_planejado: Date | null
    termino_planejado: Date | null
    /**
     * Duração em dias da tarefa
     **/
    duracao_planejado: number | null
}
