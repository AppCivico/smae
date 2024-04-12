import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, ValidateNested } from 'class-validator';

export class UpdateWorkflowAndamentoFaseDto {
    @IsInt()
    transferencia_id: number;

    @IsInt()
    fase_id: number;

    @IsOptional()
    @IsInt()
    situacao_id: number;

    @IsOptional()
    @IsInt()
    orgao_responsavel_id: number;

    @IsOptional()
    @IsInt()
    pessoa_responsavel_id: number;

    //@IsOptional()
    @IsArray({ message: '$property| tarefa(s): precisa ser uma array.' })
    @Type(() => WorkflowTarefaUpdateParamDto)
    @ValidateNested({ each: true })
    tarefas: WorkflowTarefaUpdateParamDto[];
}

export class WorkflowTarefaUpdateParamDto {
    @IsInt()
    id: number;

    @IsOptional()
    @IsInt()
    orgao_responsavel_id: number;

    @IsBoolean()
    concluida: boolean;
}

export class WorkflowFinalizarFaseDto {
    @IsInt()
    transferencia_id: number;

    @IsInt()
    fase_id: number;
}
