import { ApiProperty } from '@nestjs/swagger';
import { EleicaoTipo } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, Max, Min } from 'class-validator';

export class CreateEleicaoDto {
    @ApiProperty({ enum: EleicaoTipo, enumName: 'EleicaoTipo' })
    @IsEnum(EleicaoTipo, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(EleicaoTipo).join(', '),
    })
    tipo: EleicaoTipo;

    @ApiProperty({ description: 'Ano da eleição', example: 2024 })
    @Type(() => Number)
    @IsInt()
    @Min(1900)
    @Max(2100)
    ano: number;

    @ApiProperty({ description: 'Se esta eleição está sendo usada para mandatos atuais' })
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    atual_para_mandatos: boolean;
}
