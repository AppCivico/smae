import { ApiProperty } from '@nestjs/swagger';
import { WorkflowResponsabilidade } from 'src/generated/prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional } from 'class-validator';

export class CreateWorkflowFluxoTarefaDto {
    @IsInt({ message: '$property| workflow_tarefa_id precisa ser um número ou null' })
    @Type(() => Number)
    workflow_tarefa_id: number;

    @IsInt({ message: '$property| fluxo_fase_id precisa ser um número ou null' })
    @Type(() => Number)
    fluxo_fase_id: number;

    @IsNumber()
    @IsInt({ message: '$property| ordem precisa ser um número ou null' })
    @IsOptional()
    ordem: number;

    @ApiProperty({ enum: WorkflowResponsabilidade, enumName: 'WorkflowResponsabilidade' })
    @IsEnum(WorkflowResponsabilidade, {
        message:
            '$property| Precisa ser um dos seguintes valores: ' + Object.values(WorkflowResponsabilidade).join(', '),
    })
    responsabilidade: WorkflowResponsabilidade;

    @IsOptional()
    @IsBoolean({ message: '$property| precisa ser um boolean' })
    marco?: boolean;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    duracao: number;
}
