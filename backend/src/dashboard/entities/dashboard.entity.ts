export class DashboardItemDto {
    id: number
    url: string
    titulo: string
}

export class DashboardOptionDto {
    url: string
    value: string
}

export class DashboardItemWithOptionsDto {
    id: number
    titulo: string
    options_label: string
    options: DashboardOptionDto[]
}

export class DashboardLinhasDto {
    linhas: DashboardItemDto[] | DashboardItemWithOptionsDto[]
}
