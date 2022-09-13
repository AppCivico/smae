export class AgregadoresDto {
    id: number
    codigo: string
    descricao: string
}

export class ListAgregadoresDto {
    linhas: AgregadoresDto[]
}