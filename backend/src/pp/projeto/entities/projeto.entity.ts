import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger';
import { CategoriaProcessoSei, ProjetoFase, ProjetoOrigemTipo, ProjetoStatus } from '@prisma/client';
import { IdDesc } from 'src/atividade/entities/atividade.entity';
import { IdCodTituloDto } from 'src/common/dto/IdCodTitulo.dto';
import { IdNomeExibicaoDto, IdNomeExibicaoOrgaoDto } from 'src/common/dto/IdNomeExibicao.dto';
import { IdNomeIdentificadorDto } from 'src/common/dto/IdNomeIdentificador.dto';
import { IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { TarefaCronogramaDto } from 'src/common/dto/TarefaCronograma.dto';
import { IdNomeDto } from '../../../common/dto/IdNome.dto';
import { IdTituloDto } from '../../../common/dto/IdTitulo.dto';
import { ResumoDetalheOrigensDto } from '../../../common/dto/origem-pdm.dto';
import { GeolocalizacaoDto } from '../../../geo-loc/entities/geo-loc.entity';
import { ArquivoBaseDto } from '../../../upload/dto/create-upload.dto';
import { IsDateYMD } from '../../../auth/decorators/date.decorator';

export class ProjetoDto {
    id: number;
    nome: string;
    @ApiProperty({
        enum: ProjetoStatus,
        enumName: 'ProjetoStatus',
        description: 'Status do projeto, apenas os que não começam com MDO...',
    })
    status: ProjetoStatus;
    orgao_responsavel: IdSiglaDescricao | null;
    arquivado: boolean;
    eh_prioritario: boolean;
    meta: IdCodTituloDto | null;
    codigo: string | null;
    portfolio: PortIdTituloModeloClonagemDto;
    portfolios_compartilhados: IdTituloDto[];
    geolocalizacao: GeolocalizacaoDto[];
}

export class ProjetoMdoDto {
    id: number;
    nome: string;
    codigo: string | null;
    portfolio: IdTituloDto;
    orgao_origem: IdSiglaDescricao | null;
    grupo_tematico: IdNomeDto | null;
    tipo_intervencao: IdNomeDto | null;
    equipamento: IdNomeDto | null;
    empreendimento: IdNomeIdentificadorDto | null;
    regioes: string;
    revisado: boolean | null;
    @ApiProperty({
        enum: ProjetoStatus,
        enumName: 'ProjetoStatus',
        description: 'Status da obra, apenas os que começam com MDO_...',
    })
    status: ProjetoStatus;
}

export class ProjetoV2Dto extends ProjetoMdoDto {
    registrado_em: Date;
    previsao_custo: number | null;
    @IsDateYMD({ nullable: true })
    previsao_termino: string | null;

    orgao_responsavel: IdSiglaDescricao | null;
    projeto_etapa: string | null;
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

    acao_iniciar_obra: boolean;
    acao_concluir_obra: boolean;
    acao_paralisar_obra: boolean;

    acao_clonar_cronograma: boolean;

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
     *
     * Os usuários que tiverem esse campo TRUE mas sou_responsavel=false, são os usuários espectadores,
     * que só podem visualizar e nunca editar nem mesmo o realizado
     */
    apenas_leitura: boolean;
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
    criador: IdNomeExibicaoDto | null;
    comentarios: string | null;
    observacoes: string | null;
}

export class ListProjetoSeiDto {
    linhas: ProjetoSeiDto[];
}

export class IdTituloNivelMaxRegDto {
    id: number;
    titulo: string;
    nivel_maximo_tarefa: number;
    nivel_regionalizacao: number;
    modelo_clonagem: boolean;
    orcamento_execucao_disponivel_meses: number[];
}

export class PortIdTituloModeloClonagemDto {
    id: number;
    titulo: string;
    modelo_clonagem: boolean;
}

export class ProjetoEquipeItemDto {
    orgao_id: number;
    pessoa: IdNomeExibicaoDto;
}

export class IdDescRegiaoComParent extends IdDesc {
    parente_id: number | null;
    nivel: number;
}

export class ProjetoDetailDto extends ResumoDetalheOrigensDto {
    id: number;
    meta_id: number | null;
    iniciativa_id: number | null;
    atividade_id: number | null;
    projeto_etapa: IdDesc | null;
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
    portfolio: IdTituloNivelMaxRegDto;
    codigo: string | null;
    objeto: string;
    objetivo: string;
    publico_alvo: string | null;
    @IsDateYMD({ nullable: true })
    previsao_inicio: string | null;
    previsao_custo: number | null;
    previsao_duracao: number | null;
    @IsDateYMD({ nullable: true })
    previsao_termino: string | null;

    previsao_calculada: boolean;

    @IsDateYMD({ nullable: true })
    projecao_termino: string | null;
    percentual_concluido: number | null;
    @IsDateYMD({ nullable: true })
    realizado_inicio: string | null;
    @IsDateYMD({ nullable: true })
    realizado_termino: string | null;
    realizado_custo: number | null;

    atraso: number | null;
    tolerancia_atraso: number;
    em_atraso: boolean;
    percentual_atraso: number | null;
    status_cronograma: string | null;
    realizado_duracao: number | null;

    nao_escopo: string | null;
    orgaos_participantes: IdSiglaDescricao[];
    /**
     * ganhou o valor do campo "escopo", e agora pode ser null
     *
     * @example ""
     */
    principais_etapas: string | null;
    orgao_gestor: IdSiglaDescricao;
    orgao_responsavel: IdSiglaDescricao | null;
    responsavel: IdNomeExibicaoDto | null;
    premissas: ProjetoPremissa[] | null;
    restricoes: ProjetoRestricoes[] | null;
    fonte_recursos: ProjetoRecursos[] | null;
    origem_tipo: ProjetoOrigemTipo;
    origem_outro: string | null;
    meta_codigo: string | null;

    selecionado_em: Date | null;
    em_planejamento_em: Date | null;

    @IsDateYMD({ nullable: true })
    data_aprovacao: string | null;
    @IsDateYMD({ nullable: true })
    data_revisao: string | null;
    versao: string | null;

    eh_prioritario: boolean;
    arquivado: boolean;

    secretario_executivo: string | null;
    secretario_responsavel: string | null;
    coordenador_ue: string | null;

    equipe: ProjetoEquipeItemDto[];
    grupo_portfolio: IdTituloDto[];
    meta: ProjetoMetaDetailDto | null;
    iniciativa: IdCodTituloDto | null;
    atividade: IdCodTituloDto | null;
    // responsaveis_no_orgao_gestor:

    responsaveis_no_orgao_gestor: IdNomeExibicaoDto[];
    permissoes: ProjetoPermissoesDto;

    ano_orcamento: number[];

    portfolios_compartilhados: IdTituloDto[] | null;

    regiao: IdDesc | null;
    logradouro_tipo: string | null;
    logradouro_nome: string | null;
    logradouro_numero: string | null;
    logradouro_cep: string | null;

    geolocalizacao: GeolocalizacaoDto[];

    tarefa_cronograma: TarefaCronogramaDto;
    bloco_nota_token: string;
    regioes: IdDescRegiaoComParent[];

    secretario_colaborador: string | null;
    orgao_colaborador: IdSiglaDescricao | null;
    colaboradores_no_orgao: IdNomeExibicaoOrgaoDto[];

    orgao_origem: IdSiglaDescricao | null;

    tags: IdDesc[];
}

export class ProjetoDetailBaseMdo {
    grupo_tematico: IdNomeDto;
    tipo_intervencao: IdNomeDto | null;
    equipamento: IdNomeDto | null;
    empreendimento: IdNomeIdentificadorDto | null;

    orgao_executor: IdSiglaDescricao | null;
    mdo_detalhamento: string | null;
    mdo_n_unidades_habitacionais: number | null;
    mdo_n_familias_beneficiadas: number | null;
    mdo_n_unidades_atendidas: number | null;
    @IsDateYMD({ nullable: true })
    mdo_previsao_inauguracao: string | null;
    mdo_observacoes: string | null;
    @ApiProperty({ deprecated: true })
    tipo_aditivo: any;
    modalidade_contratacao: IdNomeDto | null;
    programa: IdNomeDto | null;

    @ApiProperty({ deprecated: true })
    mdo_programa_habitacional: string | null;
}
export class ProjetoDetailMdoDto extends IntersectionType(ProjetoDetailBaseMdo, ProjetoDetailDto) {}

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
    nome?: string; // só volta no report, n volta na api
    fonte_recurso_cod_sof: string;
    fonte_recurso_ano: number;
    valor_percentual: number | null;
    valor_nominal: number | null;
}

export class ProjetoDocumentoDto {
    arquivo: ArquivoBaseDto;
    id: number;
    descricao: string | null;
    data: Date | null;
}

export class ListProjetoDocumento {
    linhas: ProjetoDocumentoDto[];
}
