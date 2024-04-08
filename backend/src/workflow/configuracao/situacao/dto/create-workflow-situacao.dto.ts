import { ApiProperty } from '@nestjs/swagger';
import { WorkflowSituacaoTipo } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWorkflowSituacaoDto {
    @IsString()
    @MaxLength(250)
    @MinLength(1)
    situacao: string;

    @ApiProperty({ enum: WorkflowSituacaoTipo, enumName: 'WorkflowSituacaoTipo' })
    @IsEnum(WorkflowSituacaoTipo, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(WorkflowSituacaoTipo).join(', '),
    })
    tipo_situacao: WorkflowSituacaoTipo;
}
