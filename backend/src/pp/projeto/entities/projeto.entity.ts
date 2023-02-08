
import { ApiProperty } from '@nestjs/swagger';
import { CategoriaProcessoSei, ProjetoFase, ProjetoOrigemTipo, ProjetoStatus } from '@prisma/client';
import { IdCodTituloDto } from 'src/common/dto/IdCodTitulo.dto';
import { IdNomeExibicao } from 'src/common/dto/IdNomeExibicao.dto';
import { IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { IdTituloDto } from '../../../common/dto/IdTitulo.dto';
import { TipoDocumento } from '../../../tipo-documento/entities/tipo-documento.entity';

export class ProjetoDto {
    id: number;
    nome: string;
    @ApiProperty({ enum: ProjetoStatus, enumName: 'ProjetoStatus' })
    status: ProjetoStatus;
    orgao_responsavel: IdSiglaDescricao | null;
    arquivado: boolean
    eh_prioritario: boolean
    meta: IdCodTituloDto | null;
    portfolio: IdTituloDto
}

export class ListProjetoDto {
    linhas: ProjetoDto[];
}

export class ProjetoPermissoesDto {
    acao_arquivar: boolean
    acao_restaurar: boolean
    acao_selecionar: boolean
    acao_finalizar_planejamento: boolean
    acao_validar: boolean
    acao_iniciar: boolean
    acao_suspender: boolean
    acao_reiniciar: boolean
    acao_cancelar: boolean
    acao_terminar: boolean
    campo_premissas: boolean
    campo_restricoes: boolean
    campo_codigo_liberado: boolean
    campo_data_aprovacao: boolean
    campo_data_revisao: boolean
    campo_versao: boolean
}

export class ProjetoMetaDetailDto {
    /**
     * @example "0"
    */
    id: number

    /**
     * @example "string"
    */
    codigo: string

    /**
     * @example "string"
    */
    titulo: string

    /**
     * @example "0"
    */
    pdm_id: number
}

export class ProjetoSeiDto {
    id: number
    categoria: CategoriaProcessoSei
    processo_sei: String
    registro_sei_info: String
}

export class ProjetoDetailDto {
    id: number;
    meta_id: number | null;
    iniciativa_id: number | null;
    atividade_id: number | null;
    nome: string;
    /**
     * @example "EmAcompanhamento"
    */
    @ApiProperty({ enum: ProjetoStatus, enumName: 'ProjetoStatus' })
    status: ProjetoStatus;
    /**
     * @example "Acompanhamento"
    */
    @ApiProperty({ enum: ProjetoFase, enumName: 'ProjetoFase' })
    fase: ProjetoFase;
    resumo: string;
    portfolio_id: number
    codigo: string | null;
    objeto: string;
    objetivo: string;
    publico_alvo: string | null;
    previsao_inicio: Date | null;
    previsao_custo: number | null;
    previsao_duracao: number | null;
    previsao_termino: Date | null;

    realizado_inicio: Date | null;
    realizado_termino: Date | null;
    realizado_custo: number | null;

    escopo: string | null;
    nao_escopo: string | null;
    orgaos_participantes: IdSiglaDescricao[];
    principais_etapas: string;
    orgao_gestor: IdSiglaDescricao;
    orgao_responsavel: IdSiglaDescricao | null;
    responsavel: IdNomeExibicao | null;
    premissas: ProjetoPremissa[] | null;
    restricoes: ProjetoRestricoes[] | null;
    recursos: ProjetoRecursos[] | null;
    sei: ProjetoSeiDto[] | null;
    origem_tipo: ProjetoOrigemTipo;
    origem_outro: string | null;
    meta_codigo: string | null

    data_aprovacao: Date | null
    data_revisao: Date | null
    versao: string | null

    eh_prioritario: boolean
    arquivado: boolean

    meta: ProjetoMetaDetailDto | null
    // responsaveis_no_orgao_gestor:

    permissoes: ProjetoPermissoesDto
}

export class ProjetoPremissa {
    id: number;
    premissa: string;
}

export class ProjetoRestricoes {
    id: number;
    restricao: string;
}

export class ProjetoRecursos {
    id: number;
    fonte_recurso_cod_sof: string;
    fonte_recurso_ano: number;
    valor_percentual: number | null;
    valor_nominal: number | null;
}

export class ProjetoDocumentoDto {
    arquivo: {
        id: number;
        descricao: string | null;
        tamanho_bytes: number;
        TipoDocumento: TipoDocumento | null;
        nome_original: string;
        download_token?: string;
    };
    id: number;
}

export class ListProjetoDocumento {
    linhas: ProjetoDocumentoDto[];
}
