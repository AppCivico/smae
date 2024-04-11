import { IsInt, IsOptional } from 'class-validator';

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
}

export class WorkflowFinalizarFaseDto {
    @IsInt()
    transferencia_id: number;

    @IsInt()
    fase_id: number;
}
