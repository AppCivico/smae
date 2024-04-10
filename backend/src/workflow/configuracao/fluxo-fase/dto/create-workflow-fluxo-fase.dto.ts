import { ApiProperty } from '@nestjs/swagger';
import { WorkflowResponsabilidade } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNumber, IsOptional } from 'class-validator';

export class CreateWorkflowfluxoFaseDto {
    @IsInt({ message: '$property| fluxo_id precisa ser um número ou null' })
    @Type(() => Number)
    fluxo_id: number;

    @IsInt({ message: '$property| fase_id precisa ser um número ou null' })
    @Type(() => Number)
    fase_id: number;

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

    /**
     * IDs de Workflow Situação
     * @example "[1, 2, 3]"
     */
    @IsArray({
        message: '$property| Situações deve ser um array.',
    })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @IsOptional()
    situacao?: number[];
}
