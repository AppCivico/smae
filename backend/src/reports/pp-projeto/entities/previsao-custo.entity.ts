import { PartialType, OmitType } from '@nestjs/mapped-types';
import { ProjetoDetailDto } from '../../../pp/projeto/entities/projeto.entity';

export class RelProjetoRelatorioDto extends PartialType(OmitType(ProjetoDetailDto, ['premissas', 'restricoes', 'fonte_recursos', 'orgaos_participantes'])) {
    fonte_recursos: string | null
    premissas: string | null
    restricoes: string | null
    orgaos_participantes: string | null
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
