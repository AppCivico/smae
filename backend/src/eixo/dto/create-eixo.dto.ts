import { ApiProperty } from '@nestjs/swagger';
import { TipoPdm } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
export class CreateEixoDto {
    /**
     * Descrição
     */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| descrição: Máximo 250 caracteres' })
    descricao: string;

    /**
     * pdm_id
     */
    @IsInt({ message: '$property| precisa ser um número' })
    @Type(() => Number)
    pdm_id: number;

    @IsOptional()
    @IsEnum(TipoPdm, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(TipoPdm).join(', '),
    })
    @ApiProperty({ enum: TipoPdm, enumName: 'TipoPdm' })
    pdm_tipo?: TipoPdm;
}
