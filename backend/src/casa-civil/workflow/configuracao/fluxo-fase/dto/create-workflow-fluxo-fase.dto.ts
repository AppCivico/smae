import { ApiProperty } from '@nestjs/swagger';
import { WorkflowResponsabilidade } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateWorkflowfluxoFaseDto {
    @IsInt({ message: 'fluxo_id precisa ser um número ou null' })
    @Type(() => Number)
    fluxo_id: number;

    @IsInt({ message: 'fase_id precisa ser um número ou null' })
    @Type(() => Number)
    fase_id: number;

    @IsInt({ message: 'precisa ser um número' })
    @Max(1000)
    @Min(0)
    @IsOptional()
    ordem: number;

    /**
     * IDs de Workflow Situação
     * @example "[1, 2, 3]"
     */
    @IsArray({
        message: 'Situações deve ser um array.',
    })
    @IsInt({ each: true, message: 'Cada item precisa ser um número inteiro' })
    @IsOptional()
    situacao?: number[];

    @IsOptional()
    @IsBoolean({ message: 'precisa ser um boolean' })
    marco?: boolean;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    duracao: number;

    @ApiProperty({ enum: WorkflowResponsabilidade, enumName: 'WorkflowResponsabilidade' })
    @IsEnum(WorkflowResponsabilidade, {
        message:
            'Precisa ser um dos seguintes valores: ' + Object.values(WorkflowResponsabilidade).join(', '),
    })
    responsabilidade: WorkflowResponsabilidade;
}
