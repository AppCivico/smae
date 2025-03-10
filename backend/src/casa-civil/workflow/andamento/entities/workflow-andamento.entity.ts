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
}

export class AndamentoTarefaDto {
    id: number;
    orgao_responsavel: IdSiglaDescricao | null;
    necessita_preencher_orgao: boolean;
    concluida: boolean;
}
