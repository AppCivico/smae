import { PartialType, OmitType } from '@nestjs/mapped-types';
import { ProjetoDetailDto } from '../../../pp/projeto/entities/projeto.entity';
import { RelProjetosAditivosDto, RelProjetosContratosDto } from 'src/reports/pp-projetos/entities/projetos.entity';

export class RelProjetoRelatorioDto extends PartialType(
    OmitType(ProjetoDetailDto, [
        'premissas',
        'restricoes',
        'fonte_recursos',
        'orgaos_participantes',
        'responsaveis_no_orgao_gestor',
        'selecionado_em',
        'em_planejamento_em',
        'permissoes',
        'responsavel',
        'portfolio',
        'orgao_gestor',
        'orgao_responsavel',
        'fase',
        'previsao_inicio',
        'previsao_termino',
        'realizado_inicio',
        'realizado_termino',
        'projecao_termino',
        'data_aprovacao',
        'data_revisao',
    ])
) {
    fonte_recursos: string | null;
    premissas: string | null;
    restricoes: string | null;
    orgaos_participantes: string | null;
    responsaveis_no_orgao_gestor: string | null;
    responsavel_id: number | null;
    responsavel_nome_exibicao: string | null;
    portfolio_titulo: string;
    portfolio_nivel_maximo_tarefa: number;
    orgao_gestor_id: number;
    orgao_gestor_sigla: string;
    orgao_gestor_descricao: string;
    orgao_responsavel_id: number | null;
    orgao_responsavel_sigla: string | null;
    orgao_responsavel_descricao: string | null;
    previsao_inicio: string | null;
    previsao_termino: string | null;
    realizado_inicio: string | null;
    realizado_termino: string | null;
    projecao_termino: string | null;
    data_aprovacao: string | null;
    data_revisao: string | null;
}

export class RelProjetoCronogramaDto {
    hirearquia: string;
    tarefa: string;
    inicio_planejado: string | null;
    termino_planejado: string | null;
    custo_estimado: number | null;
    duracao_planejado: number | null;
    inicio_real: string | null;
    termino_real: string | null;
    duracao_real: number | null;
    percentual_concluido: number | null;
    custo_real: number | null;
}

export class RelProjetoRiscoDto {
    codigo: number;
    titulo: string;
    descricao: string | null;
    probabilidade: number | null;
    probabilidade_descricao: string | null;
    impacto: number | null;
    impacto_descricao: string | null;
    grau: number | null;
    grau_descricao: string | null;
    status: string;
}

export class RelProjetoPlanoAcaoDto {
    codigo_risco: number;
    contramedida: string;
    medidas_de_contingencia: string;
    prazo_contramedida: string | null;
    responsavel: string | null;
}

export class RelProjetoAcompanhamentoDto {
    id: number;
    acompanhamento_tipo: string | null;
    numero: number;
    data_registro: string | null;
    participantes: string;
    detalhamento: string | null;
    observacao: string | null;
    detalhamento_status: string | null;
    pontos_atencao: string | null;
    pauta: string | null;
    cronograma_paralisado: boolean;
    riscos: string | null;
}

export class RelProjetoEncaminhamentoDto {
    acompanhamento_id: number;
    numero_encaminhamento: string;
    encaminhamento: string | null;
    responsavel: string | null;
    prazo_encaminhamento: string | null;
    prazo_realizado: string | null;
}

export class RelProjetoOrigemDto {
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

export class PPProjetoRelatorioDto {
    detail: RelProjetoRelatorioDto;
    cronograma: RelProjetoCronogramaDto[];
    riscos: RelProjetoRiscoDto[];
    planos_acao: RelProjetoPlanoAcaoDto[];
    acompanhamentos: RelProjetoAcompanhamentoDto[];
    encaminhamentos: RelProjetoEncaminhamentoDto[];
    contratos: RelProjetosContratosDto[];
    aditivos: RelProjetosAditivosDto[];
    origens: RelProjetoOrigemDto[];
}
