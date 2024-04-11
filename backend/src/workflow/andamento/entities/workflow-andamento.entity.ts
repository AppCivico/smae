import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { IdNomeExibicao } from 'src/meta/entities/meta.entity';
import {
    DetailWorkflowFluxoDto,
    DetailWorkflowFluxoFaseDto,
    DetailWorkflowFluxoFaseTarefaDto,
    WorkflowDetailDto,
} from 'src/workflow/configuracao/entities/workflow.entity';
import { WorkflowSituacaoDto } from 'src/workflow/configuracao/situacao/entities/workflow-situacao.entity';

export class WorkflowAndamentoDto extends PartialType(OmitType(WorkflowDetailDto, ['transferencia_tipo'])) {
    @ApiProperty({ type: () => [WorkflowAndamentoFluxoDto] })
    fluxo?: WorkflowAndamentoFluxoDto[] | undefined;
    possui_proxima_etapa: boolean;
    pode_passar_para_proxima_etapa: boolean;
}

export class WorkflowAndamentoFluxoDto extends DetailWorkflowFluxoDto {
    @ApiProperty({ type: () => [WorkflowAndamentoFasesDto] })
    fases: WorkflowAndamentoFasesDto[];
}

export class WorkflowAndamentoFasesDto extends DetailWorkflowFluxoFaseDto {
    @ApiProperty({ type: () => [WorkflowAndamentoTarefasDto] })
    tarefas: WorkflowAndamentoTarefasDto[];
    andamento: AndamentoFaseDto | null;
}

export class WorkflowAndamentoTarefasDto extends DetailWorkflowFluxoFaseTarefaDto {
    andamento: AndamentoTarefaDto | null;
}

export class AndamentoFaseDto {
    situacao: WorkflowSituacaoDto;
    orgao_responsavel: IdSiglaDescricao | null;
    pessoa_responsavel: IdNomeExibicao | null;
    data_inicio: Date | null;
    data_termino: Date | null;
    pode_concluir: boolean;
    concluida: boolean;
}

export class AndamentoTarefaDto {
    orgao_responsavel: IdSiglaDescricao | null;
    concluida: boolean;
}
