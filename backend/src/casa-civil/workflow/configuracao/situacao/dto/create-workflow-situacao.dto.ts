import { ApiProperty } from '@nestjs/swagger';
import { WorkflowSituacaoTipo } from 'src/generated/prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreateWorkflowSituacaoDto {
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Situação' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    @MinLength(1)
    situacao: string;

    @ApiProperty({ enum: WorkflowSituacaoTipo, enumName: 'WorkflowSituacaoTipo' })
    @IsEnum(WorkflowSituacaoTipo, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(WorkflowSituacaoTipo).join(', '),
    })
    tipo_situacao: WorkflowSituacaoTipo;
}
