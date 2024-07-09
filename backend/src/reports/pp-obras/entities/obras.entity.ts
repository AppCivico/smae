import { ApiProperty } from '@nestjs/swagger';
import { ContratoPrazoUnidade, ProjetoStatus, StatusContrato } from '@prisma/client';
import { IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { ProjetoPremissa, ProjetoRecursos, ProjetoRestricoes } from 'src/pp/projeto/entities/projeto.entity';
import { IdNomeExibicaoDto } from '../../../common/dto/IdNomeExibicao.dto';
import { IdNomeDto } from 'src/common/dto/IdNome.dto';

export class RelObrasDto {
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
    portfolio_id: number;
    portfolio_titulo: string;
    codigo: string | null;
    objeto: string;
    objetivo: string;
    publico_alvo: string | null;
    previsao_inicio: string | null;
    previsao_custo: number | null;
    previsao_duracao: number | null;
    previsao_termino: string | null;
    escopo: string | null;
    nao_escopo: string | null;
    secretario_responsavel: string | undefined;
    secretario_executivo: string | undefined;
    coordenador_ue: string | undefined;
    data_aprovacao: Date | undefined;
    data_revisao: Date | undefined;
    gestores: string;

    orgao_participante: IdSiglaDescricao;
    orgao_gestor: IdSiglaDescricao;
    orgao_responsavel: IdSiglaDescricao | null;
    responsavel: IdNomeExibicaoDto | null;
    premissa: ProjetoPremissa | null;
    restricao: ProjetoRestricoes | null;
    fonte_recurso: ProjetoRecursos | null;

    versao: string | null;

    projeto_etapa: string | null;
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
    area_geradora: IdSiglaDescricao | null;
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

export class PPObrasRelatorioDto {
    linhas: RelObrasDto[];
    cronograma: RelObrasCronogramaDto[];
    acompanhamentos: RelObrasAcompanhamentosDto[];
    regioes: RelObrasRegioesDto[];
    fontes_recurso: RelObrasFontesRecursoDto[];
    contratos: RelObrasContratosDto[];
    aditivos: RelObrasAditivosDto[];
}
