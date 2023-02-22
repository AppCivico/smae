import { IdSiglaDescricao } from "../../../common/dto/IdSigla.dto"

export class TarefaItemDto {
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

}

export class TarefaDetailDto extends TarefaItemDto {
    inicio_planejado_calculado: boolean
    termino_planejado_calculado: boolean
    duracao_planejado_calculado: boolean

    inicio_real_calculado: boolean
    termino_real_calculado: boolean
    duracao_real_calculado: boolean

    descricao: string
    recursos: string
}

export class ListTarefaDto {
    linhas: TarefaItemDto[]
}
