export class DashboardItemDto {
    id: number
    url: string
    titulo: string
}

export class DashboardOptionDto {
    id: number
    url: string
    titulo: string
}

export class DashboardItemComOpcoesDto {
    id: number
    titulo: string
    opcoes_titulo: string
    opcoes: DashboardOptionDto[]
}

export type RetornoLinhasDashboardLinhasDto = DashboardItemDto | DashboardItemComOpcoesDto

export class DashboardLinhasDto {
    linhas: RetornoLinhasDashboardLinhasDto[]
}
