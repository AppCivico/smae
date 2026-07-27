import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { IdNomeExibicao } from 'src/meta/entities/meta.entity';
import {
    WorkflowDetailDto,
    DetailWorkflowFluxoDto,
    DetailWorkflowFluxoFaseDto,
    DetailWorkflowFluxoFaseTarefaDto,
} from '../../configuracao/entities/workflow.entity';
import { WorkflowSituacaoDto } from '../../configuracao/situacao/entities/workflow-situacao.entity';
import { IsDateYMD } from '../../../../auth/decorators/date.decorator';

export class WorkflowAndamentoDto extends PartialType(OmitType(WorkflowDetailDto, ['transferencia_tipo'])) {
    @ApiProperty({ type: () => [WorkflowAndamentoFluxoDto] })
    fluxo?: WorkflowAndamentoFluxoDto[] | undefined;
    possui_proxima_etapa: boolean;
    pode_passar_para_proxima_etapa: boolean;
    pode_reabrir_fase: boolean;
    /**
     * Existe workflow ativo para o tipo da transferência, portanto a opção "Reiniciar Workflow"
     * pode ser oferecida. ATENÇÃO: o reinício é irreversível — alerte o usuário antes de chamar
     * `POST /transferencia/:id/reiniciar-workflow`.
     */
    pode_reiniciar_workflow: boolean;
    /**
     * O workflow ativo do tipo é diferente do associado à transferência (ex.: decreto alterou o
     * fluxo retroativamente). Útil para destacar a opção de reinício.
     */
    workflow_desatualizado: boolean;
    /**
     * A transferência está cancelada. Quando `true`, nenhuma movimentação do workflow é permitida
     * (iniciar/finalizar/reabrir fase, avançar etapa, reiniciar workflow).
     */
    transferencia_cancelada: boolean;
}

export class WorkflowAndamentoFluxoDto extends DetailWorkflowFluxoDto {
    atual: boolean;
    concluida: boolean;
    @ApiProperty({ type: () => [WorkflowAndamentoFasesDto] })
    declare fases: WorkflowAndamentoFasesDto[];
}

export class WorkflowAndamentoFasesDto extends DetailWorkflowFluxoFaseDto {
    @ApiProperty({ type: () => [WorkflowAndamentoTarefasDto] })
    declare tarefas: WorkflowAndamentoTarefasDto[];
    andamento: AndamentoFaseDto | null;
}

export class WorkflowAndamentoTarefasDto extends DetailWorkflowFluxoFaseTarefaDto {
    andamento: AndamentoTarefaDto | null;
}

export class AndamentoFaseDto {
    atual: boolean;
    situacao: WorkflowSituacaoDto | null;
    orgao_responsavel: IdSiglaDescricao | null;
    pessoa_responsavel: IdNomeExibicao | null;
    @IsDateYMD({ nullable: true })
    data_inicio: string | null;
    @IsDateYMD({ nullable: true })
    data_termino: string | null;
    pode_concluir: boolean;
    concluida: boolean;
    necessita_preencher_orgao: boolean;
    necessita_preencher_pessoa: boolean;
    dias_na_fase: number;
    tarefa_espelhada_id: number | null;
}

export class AndamentoTarefaDto {
    id: number | null;
    orgao_responsavel: IdSiglaDescricao | null;
    necessita_preencher_orgao: boolean;
    concluida: boolean;
}
