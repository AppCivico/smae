import { ApiProperty } from '@nestjs/swagger';
import { DistribuicaoStatusTipo } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDistribuicaoStatusDto {
    @IsString()
    @MaxLength(250, { message: '$property| nome: Máximo 250 caracteres' })
    @MinLength(1, { message: '$property| nome: Mínimo 1 caractere' })
    nome: string;

    @ApiProperty({ enum: DistribuicaoStatusTipo, enumName: 'DistribuicaoStatusTipo' })
    @IsEnum(DistribuicaoStatusTipo, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(DistribuicaoStatusTipo).join(', '),
    })
    tipo: DistribuicaoStatusTipo;

    @IsBoolean()
    @IsOptional()
    valor_distribuicao_contabilizado?: boolean;

    @IsBoolean()
    @IsOptional()
    permite_novos_registros?: boolean;
}
