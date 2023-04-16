import { PartialType, OmitType } from '@nestjs/mapped-types';
import { ProjetoDetailDto } from '../../../pp/projeto/entities/projeto.entity';

export class RelProjetoRelatorioDto extends PartialType(OmitType(ProjetoDetailDto, [
    'premissas', 'restricoes', 'fonte_recursos',
    'orgaos_participantes', 'responsaveis_no_orgao_gestor',
    'selecionado_em', 'em_planejamento_em', 'permissoes',
    'responsavel', 'portfolio', 'orgao_gestor', 'orgao_responsavel'
])) {
    fonte_recursos: string | null
    premissas: string | null
    restricoes: string | null
    orgaos_participantes: string | null
    responsaveis_no_orgao_gestor: string | null
    responsavel_id: number | null
    responsavel_nome_exibicao: string | null
    portfolio_titulo: string
    portfolio_nivel_maximo_tarefa: number
    orgao_gestor_id: number
    orgao_gestor_sigla: string
    orgao_gestor_descricao: string
    orgao_responsavel_id: number | null
    orgao_responsavel_sigla: string | null
    orgao_responsavel_descricao: string | null
}

export class RelProjetoCronogramaDto {
    numero: number
    tarefa: string
    inicio_planejado: Date | null
    termino_planejado: Date | null
    custo_estimado: number | null
}

export class RelProjetoRiscoDto {
    codigo: number
    titulo: string
    descricao: string | null
    probabilidade: number | null
    impacto: number | null
    grau: number | null
}

export class RelProjetoPlanoAcaoDto {
    codigo_risco: number
    contramedida: string
    medidas_de_contingencia: string
    prazo_contramedida: Date | null
    responsavel: string | null
}

export class PPProjetoRelatorioDto {
    detail: RelProjetoRelatorioDto
    cronograma: RelProjetoCronogramaDto[]
    riscos: RelProjetoRiscoDto[]
    planos_acao: RelProjetoPlanoAcaoDto[]
}
