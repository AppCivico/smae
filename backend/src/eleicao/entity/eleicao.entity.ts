import { ApiProperty } from '@nestjs/swagger';
import { EleicaoTipo } from 'src/generated/prisma/client';
import { IsEnum } from 'class-validator';

export class EleicaoDto {
    id: number;
    ano: number;
    @ApiProperty({ enum: EleicaoTipo, enumName: 'EleicaoTipo' })
    @IsEnum(EleicaoTipo)
    tipo: EleicaoTipo;
    atual_para_mandatos: boolean;
}

export class ListEleicaoDto {
    linhas: EleicaoDto[];
}
