export class RelatorioDto {
    id: number
    criado_em: Date
    criador:  { nome_exibicao: string }
    fonte: string
    arquivo: string
    parametros: any
    pdm_id: number
}
