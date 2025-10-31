import { ApiProperty } from '@nestjs/swagger';
import {
    CategoriaProcessoSei,
    ContratoPrazoUnidade,
    ProjetoOrigemTipo,
    ProjetoStatus,
    StatusContrato,
} from '@prisma/client';
import { IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { IdNomeExibicaoDto } from '../../../common/dto/IdNomeExibicao.dto';
import { IdNomeDto } from 'src/common/dto/IdNome.dto';

export class RelObrasDto {
    id: number;
    pdm_id: number | null;
    pdm_nome: string | null;
    meta_id: number | null;
    meta_nome: string | null;
    nome: string;
    /**
     * @example "EmAcompanhamento"
     */
    @ApiProperty({ enum: ProjetoStatus, enumName: 'ProjetoStatus' })
    status: ProjetoStatus;
    portfolio_id: number;
    portfolio_titulo: string;
    grupo_tematico_id: number | null;
    grupo_tematico_nome: string | null;
    tipo_obra_id: number | null;
    tipo_obra_nome: string | null;
    tipo_obra_conceito: string | null;
    equipamento_id: number | null;
    equipamento_nome: string | null;
    codigo: string | null;
    detalhamento: string | null;
    subprefeituras: string | null;
    @ApiProperty({ enum: ProjetoOrigemTipo, enumName: 'ProjetoOrigemTipo' })
    origem_tipo: ProjetoOrigemTipo;
    descricao: string | null;
    observacoes: string | null;
    inicio_planejado: string | null;
    previsao_custo: number | null;
    previsao_duracao: number | null;
    termino_planejado: string | null;
    secretario_responsavel: string | undefined;
    secretario_executivo: string | undefined;
    secretario_colaborador: string | undefined;
    data_inauguracao_planejada: string | null;
    assessores: string | null;
    etiquetas: string | null;
    orgao_origem: IdSiglaDescricao | null;
    orgao_executor: IdSiglaDescricao | null;
    orgao_gestor: IdSiglaDescricao;
    orgao_responsavel: IdSiglaDescricao | null;
    orgao_colaborador: IdSiglaDescricao | null;
    responsavel: IdNomeExibicaoDto | null;
    portfolios_compartilhados: string | null;
    pontos_focais_colaboradores: string | null;
    programa_habitacional: string | null;
    n_unidades_habitacionais: number | null;
    n_familias_beneficiadas: number | null;
    n_unidades_atendidas: number | null;
    etapa: string | null;
    custo_planejado: number | null;
    previsao_inicio: string | null;
    previsao_termino: string | null;
    empreendimento_id: number | null;
    empreendimento_identificador: string | null;
}

export class RelObrasCronogramaDto {
    obra_id: number;
    obra_codigo: string;
    tarefa_id: number;
    hirearquia: string;
    numero: number;
    nivel: number;
    tarefa: string;
    inicio_planejado: string | null;
    termino_planejado: string | null;
    custo_estimado: number | null;
    inicio_real: string | null;
    termino_real: string | null;
    duracao_real: number | null;
    percentual_concluido: number | null;
    custo_real: number | null;
    dependencias: string | null;

    responsavel: IdNomeExibicaoDto | null;
    atraso: number | null;
}

export class RelObrasAcompanhamentosDto {
    obra_id: number;
    obra_codigo: string;
    data_registro: string;
    participantes: string;
    cronograma_paralizado: boolean;
    prazo_encaminhamento: string | null;
    prazo_realizado: string | null;
    pauta: string | null;
    detalhamento: string | null;
    encaminhamento: string | null;
    responsavel: string | null;
    observacao: string | null;
    detalhamento_status: string | null;
    pontos_atencao: string | null;
    riscos: string | null;
}

export class RelObrasRegioesDto {
    obra_id: number;
    subprefeitura: RelObraRegiaoDto | null;
    distrito: RelObraRegiaoDto | null;
}

class RelObraRegiaoDto {
    descricao: string;
    sigla: string;
}

export class RelObrasFontesRecursoDto {
    obra_id: number;
    fonte_recurso_cod_sof: string;
    fonte_recurso_ano: number;
    valor_percentual: number | null;
    valor_nominal: number | null;
}

export class RelObrasContratosDto {
    id: number;
    obra_id: number;
    numero: string;
    exclusivo: boolean;
    processos_SEI: string | null;
    @ApiProperty({ enum: StatusContrato, enumName: 'StatusContrato' })
    status: StatusContrato;
    modalidade_licitacao: IdNomeDto | null;
    fontes_recurso: string | null;
    area_gestora: IdSiglaDescricao | null;
    objeto: string | null;
    descricao_detalhada: string | null;
    contratante: string | null;
    empresa_contratada: string | null;
    prazo: number | null;
    @ApiProperty({ enum: ContratoPrazoUnidade, enumName: 'ContratoPrazoUnidade' })
    unidade_prazo: ContratoPrazoUnidade | null;
    data_base: string | null;
    data_inicio: Date | null;
    data_termino: Date | null;
    data_termino_atualizada: Date | null;
    valor: number | null;
    valor_reajustado: number | null;
    percentual_medido: number | null;
    observacoes: string | null;
}

export class RelObrasAditivosDto {
    id: number;
    contrato_id: number;
    tipo: IdNomeDto;
    data: Date | null;
    valor_com_reajuste: number | null;
    percentual_medido: number | null;
    data_termino_atual: Date | null;
}

export class RelObrasOrigemDto {
    projeto_id: number;
    pdm_id: number | null;
    pdm_titulo: string | null;
    meta_id: number | null;
    meta_titulo: string | null;
    iniciativa_id: number | null;
    iniciativa_titulo: string | null;
    atividade_id: number | null;
    atividade_titulo: string | null;
}

export class RelObrasSeiDto {
    obra_id: number;
    categoria: CategoriaProcessoSei;
    processo_sei: string;
    descricao: string | null;
    link: string | null;
    comentarios: string | null;
    observacoes: string | null;
}

export class PPObrasRelatorioDto {
    linhas: RelObrasDto[];
    cronograma: RelObrasCronogramaDto[];
    acompanhamentos: RelObrasAcompanhamentosDto[];
    regioes: RelObrasRegioesDto[];
    fontes_recurso: RelObrasFontesRecursoDto[];
    contratos: RelObrasContratosDto[];
    aditivos: RelObrasAditivosDto[];
    origens: RelObrasOrigemDto[];
    processos_sei: RelObrasSeiDto[];
    enderecos: RelObrasGeolocDto[];
}

export class RelObrasGeolocDto {
    obra_id: number;
    endereco: string;
    cep: string;
}
