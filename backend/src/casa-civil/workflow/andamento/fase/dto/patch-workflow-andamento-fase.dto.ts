import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, ValidateNested } from 'class-validator';

export class UpdateWorkflowAndamentoFaseDto {
    @IsInt()
    @Type(() => Number)
    transferencia_id: number;

    @IsInt()
    @Type(() => Number)
    fase_id: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    situacao_id?: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    orgao_responsavel_id?: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    pessoa_responsavel_id?: number;

    @IsOptional()
    @IsArray({ message: '$property| tarefa(s): precisa ser uma array.' })
    @Type(() => WorkflowTarefaUpdateParamDto)
    @ValidateNested({ each: true })
    tarefas?: WorkflowTarefaUpdateParamDto[];
}

export class WorkflowTarefaUpdateParamDto {
    @IsInt()
    @Type(() => Number)
    id: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    orgao_responsavel_id?: number;

    @IsBoolean()
    concluida: boolean;
}

export class WorkflowFinalizarIniciarFaseDto {
    @IsInt()
    @Type(() => Number)
    transferencia_id: number;

    @IsInt()
    @Type(() => Number)
    fase_id: number;
}
