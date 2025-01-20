import { IdNomeDto } from 'src/common/dto/IdNome.dto';
import { WorkflowFluxoDto } from '../fluxo/entities/workflow-fluxo.entity';
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { WorkflowfluxoFaseDto } from '../fluxo-fase/entities/workflow-fluxo-fase.entity';
import { WorkflowFluxoTarefaDto } from '../fluxo-tarefa/entities/workflow-fluxo-tarefa.entity';
import { WorkflowSituacaoDto } from '../situacao/entities/workflow-situacao.entity';
import { DistribuicaoStatusDto } from 'src/casa-civil/distribuicao-recurso/distribuicao-status/entities/distribuicao-status.dto';
import { IsDateYMD } from '../../../../auth/decorators/date.decorator';

export class WorkflowDto {
    id: number;
    nome: string;
    ativo: boolean;
    inicio: Date;
    termino: Date | null;
    transferencia_tipo: IdNomeDto;
}

export class ListWorkflowDto {
    linhas: WorkflowDto[];
}

export class WorkflowDetailDto {
    id: number;
    nome: string;
    ativo: boolean;
    @IsDateYMD()
    inicio: string;
    @IsDateYMD({ nullable: true })
    termino: string | null;
    transferencia_tipo: IdNomeDto;
    edicao_restrita: boolean;
    fluxo: DetailWorkflowFluxoDto[];
    statuses_distribuicao: DistribuicaoStatusDto[];
}

export class DetailWorkflowFluxoDto extends PartialType(OmitType(WorkflowFluxoDto, ['workflow_id'])) {
    fases: DetailWorkflowFluxoFaseDto[];
}

export class DetailWorkflowFluxoFaseDto extends PartialType(OmitType(WorkflowfluxoFaseDto, ['fluxo_id'])) {
    tarefas: DetailWorkflowFluxoFaseTarefaDto[];
    @ApiProperty({ type: () => [WorkflowSituacaoDto] })
    situacoes: WorkflowSituacaoDto[];
}

export class DetailWorkflowFluxoFaseTarefaDto extends PartialType(
    OmitType(WorkflowFluxoTarefaDto, ['fluxo_fase_id'])
) {}
