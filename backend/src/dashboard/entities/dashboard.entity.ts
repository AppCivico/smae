export class DashboardItemDto {
    id: number
    url: string
    titulo: string
}

export class DashboardOptionDto {
    url: string
    titulo: string
}

export class DashboardItemComOpcoesDto {
    id: number
    titulo: string
    opcoes_titulo: string
    opcoes: DashboardOptionDto[]
}

export class DashboardLinhasDto {
    linhas: DashboardItemDto[] | DashboardItemComOpcoesDto[]
}
