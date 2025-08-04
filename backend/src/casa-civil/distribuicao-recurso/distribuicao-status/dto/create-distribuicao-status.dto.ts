import { ApiProperty } from '@nestjs/swagger';
import { DistribuicaoStatusTipo } from 'src/generated/prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreateDistribuicaoStatusDto {
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
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
