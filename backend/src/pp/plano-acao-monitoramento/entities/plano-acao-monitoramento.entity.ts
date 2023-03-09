import { IdNomeExibicao } from "../../../variavel/entities/variavel.entity"

export class PlanoAcaoMonitoramentoDto {
    id: number
    plano_acao_id: number
    data_afericao: Date
    descricao: string
    criado_em: Date
    criador: IdNomeExibicao
    ultima_revisao: boolean
}

export class ListPlanoAcaoMonitoramentoDto {
    linhas: PlanoAcaoMonitoramentoDto[]
}
