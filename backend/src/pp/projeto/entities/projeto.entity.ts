import { ApiProperty, PickType } from '@nestjs/swagger';
import { CategoriaProcessoSei, ProjetoFase, ProjetoOrigemTipo, ProjetoStatus } from '@prisma/client';
import { IdCodTituloDto } from 'src/common/dto/IdCodTitulo.dto';
import { IdNomeExibicao } from 'src/common/dto/IdNomeExibicao.dto';
import { IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { IdTituloDto } from '../../../common/dto/IdTitulo.dto';
import { TipoDocumentoDto } from '../../../tipo-documento/entities/tipo-documento.entity';
import { IdNomeDto } from 'src/common/dto/IdNome.dto';
import { IdDesc } from 'src/atividade/entities/atividade.entity';

export class ProjetoDto {
    id: number;
    nome: string;
    @ApiProperty({ enum: ProjetoStatus, enumName: 'ProjetoStatus' })
    status: ProjetoStatus;
    orgao_responsavel: IdSiglaDescricao | null;
    arquivado: boolean;
    eh_prioritario: boolean;
    meta: IdCodTituloDto | null;
    codigo: string | null;
    portfolio: IdTituloDto;
}

export class ListProjetoDto {
    linhas: ProjetoDto[];
}

export class ProjetoPermissoesDto {
    acao_arquivar: boolean;
    acao_restaurar: boolean;
    acao_selecionar: boolean;
    acao_iniciar_planejamento: boolean;
    acao_finalizar_planejamento: boolean;
    acao_validar: boolean;
    acao_iniciar: boolean;
    acao_suspender: boolean;
    acao_reiniciar: boolean;
    acao_cancelar: boolean;
    acao_terminar: boolean;
    campo_premissas: boolean;
    campo_restricoes: boolean;
    campo_codigo: boolean;
    campo_data_aprovacao: boolean;
    campo_data_revisao: boolean;
    campo_versao: boolean;

    campo_nao_escopo: boolean;
    campo_objeto: boolean;
    campo_objetivo: boolean;
    campo_publico_alvo: boolean;
    campo_secretario_executivo: boolean;
    campo_secretario_responsavel: boolean;
    campo_coordenador_ue: boolean;
    /**
     * Campo que fica TRUE quando o usuário já não tem mais o acesso total de edição
     * por exemplo, após a fase do planejamento,
     * o usuário responsável pode fazer edição no realizado, mas não pode incluir novas tarefas
     */
    apenas_leitura_planejamento: boolean;
    sou_responsavel: boolean;

    @ApiProperty({ enum: ProjetoStatus, enumName: 'ProjetoStatus' })
    status_permitidos: ProjetoStatus[];
}

export class ProjetoMetaDetailDto {
    /**
     * @example "0"
     */
    id: number;

    /**
     * @example "string"
     */
    codigo: string;

    /**
     * @example "string"
     */
    titulo: string;

    /**
     * @example "0"
     */
    pdm_id: number;
}

export class ProjetoSeiDto {
    id: number;
    @ApiProperty({ enum: CategoriaProcessoSei, enumName: 'CategoriaProcessoSei' })
    categoria: CategoriaProcessoSei;
    processo_sei: string;
    descricao: string | null;
    link: string | null;
    criador: IdNomeExibicao | null;
}

export class ListProjetoSeiDto {
    linhas: ProjetoSeiDto[];
}

export class IdTituloNivelMaxDto {
    id: number;
    titulo: string;
    nivel_maximo_tarefa: number;
    orcamento_execucao_disponivel_meses: number[];
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
    portfolio_id: number;
    portfolio: IdTituloNivelMaxDto;
    codigo: string | null;
    objeto: string;
    objetivo: string;
    publico_alvo: string | null;
    previsao_inicio: Date | null;
    previsao_custo: number | null;
    previsao_duracao: number | null;
    previsao_termino: Date | null;
    projecao_termino: Date | null;
    percentual_concluido: number | null;

    realizado_inicio: Date | null;
    realizado_termino: Date | null;
    realizado_custo: number | null;

    atraso: number | null;
    tolerancia_atraso: number;
    em_atraso: boolean;
    percentual_atraso: number | null;
    status_cronograma: string | null;
    realizado_duracao: number | null;

    escopo: string | null;
    nao_escopo: string | null;
    orgaos_participantes: IdSiglaDescricao[];
    principais_etapas: string;
    orgao_gestor: IdSiglaDescricao;
    orgao_responsavel: IdSiglaDescricao | null;
    responsavel: IdNomeExibicao | null;
    premissas: ProjetoPremissa[] | null;
    restricoes: ProjetoRestricoes[] | null;
    fonte_recursos: ProjetoRecursos[] | null;
    origem_tipo: ProjetoOrigemTipo;
    origem_outro: string | null;
    meta_codigo: string | null;

    selecionado_em: Date | null;
    em_planejamento_em: Date | null;

    data_aprovacao: Date | null;
    data_revisao: Date | null;
    versao: string | null;

    eh_prioritario: boolean;
    arquivado: boolean;

    secretario_executivo: string | null;
    secretario_responsavel: string | null;
    coordenador_ue: string | null;

    meta: ProjetoMetaDetailDto | null;
    // responsaveis_no_orgao_gestor:

    responsaveis_no_orgao_gestor: IdNomeExibicao[];
    permissoes: ProjetoPermissoesDto;

    ano_orcamento: number[];

    regiao: IdDesc | null;
    logradouro_tipo: string | null;
    logradouro_nome: string | null;
    logradouro_numero: string | null;
    logradouro_cep: string | null;
}

export class ProjetoMVPDto extends PickType(ProjetoDetailDto, ['id', 'portfolio_id']) {}

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
        TipoDocumento: TipoDocumentoDto | null;
        nome_original: string;
        download_token?: string;
    };
    id: number;
}

export class ListProjetoDocumento {
    linhas: ProjetoDocumentoDto[];
}
