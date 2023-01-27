import { IdCodTituloDto } from "src/common/dto/IdCodTitulo.dto"

export class ProjetoDto {
    id: number
    nome: string
    status: string
    orgao_responsavel: ProjetoOrgaoResponsavel | null
    meta: IdCodTituloDto | null
}

class ProjetoOrgaoResponsavel {
    id: number
    sigla: string
    descricao: string
}

export class ListProjetoDto {
    linhas: ProjetoDto[]
}

export class ProjetoDetailDto {
//     id
// nome
// status
// orgao_responsavel
// meta
}
