import { ProjetoStatus } from "@prisma/client"
import { IdCodTituloDto } from "src/common/dto/IdCodTitulo.dto"
import { IdNomeExibicao } from "src/common/dto/IdNomeExibicao.dto"
import { IdSiglaDescricao } from "src/common/dto/IdSigla.dto"
import { TipoDocumento } from "../../../tipo-documento/entities/tipo-documento.entity"

export class ProjetoDto {
    id: number
    nome: string
    status: ProjetoStatus
    orgao_responsavel: IdSiglaDescricao | null
    meta: IdCodTituloDto | null
}

export class ListProjetoDto {
    linhas: ProjetoDto[]
}

export class ProjetoDetailDto {
    id: number
    meta_id: number | null
    iniciativa_id: number | null
    atividade_id: number | null
    nome: string
    status: ProjetoStatus
    resumo: string
    codigo: string | null
    descricao: string
    objeto: string
    objetivo: string
    publico_alvo: string | null
    previsao_inicio: Date | null
    previsao_custo: number | null
    previsao_duracao: number | null
    previsao_termino: Date | null
    inicio_real: Date | null
    custo_real: number | null
    realizado_inicio: Date | null
    realizado_termino: Date | null
    realizado_custo: number | null
    escopo: string | null
    nao_escopo: string | null
    orgaos_participantes: IdSiglaDescricao[]
    principais_etapas: string
    orgao_gestor: IdSiglaDescricao
    orgao_responsavel: IdSiglaDescricao | null
    responsavel: IdNomeExibicao | null
    premissas: ProjetoPremissa[] | null
    restricoes: ProjetoRestricoes[] | null
    recursos: ProjetoRecursos[] | null

    // responsaveis_no_orgao_gestor:
}

export class ProjetoPremissa {
    id: number
    premissa: string
}

export class ProjetoRestricoes {
    id: number
    restricao: string
}

export class ProjetoRecursos {
    id: number
    fonte_recurso_cod_sof: string
    fonte_recurso_ano: number
    valor_percentual: number | null
    valor_nominal: number | null
}

export class ProjetoDocumentoDto {
    arquivo: {
        id: number;
        descricao: string | null;
        tamanho_bytes: number;
        TipoDocumento: TipoDocumento | null;
        nome_original: string;
        download_token?: string
    };
    id: number;
}

export class ListProjetoDocumento {
    linhas: ProjetoDocumentoDto[]
}
