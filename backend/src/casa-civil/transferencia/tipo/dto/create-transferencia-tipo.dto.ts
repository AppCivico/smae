import { ApiProperty } from '@nestjs/swagger';
import { TransferenciaTipoCategoria, TransferenciaTipoEsfera } from 'src/generated/prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreateTransferenciaTipoDto {
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    @MinLength(1, { message: '$property| nome: Mínimo 1 caractere' })
    nome: string;

    @ApiProperty({ enum: TransferenciaTipoCategoria, enumName: 'TransferenciaTipoCategoria' })
    @IsEnum(TransferenciaTipoCategoria, {
        message:
            '$property| Precisa ser um dos seguintes valores: ' + Object.values(TransferenciaTipoCategoria).join(', '),
    })
    categoria: TransferenciaTipoCategoria;

    @ApiProperty({ enum: TransferenciaTipoEsfera, enumName: 'TransferenciaTipoEsfera' })
    @IsEnum(TransferenciaTipoEsfera, {
        message:
            '$property| Precisa ser um dos seguintes valores: ' + Object.values(TransferenciaTipoEsfera).join(', '),
    })
    esfera: TransferenciaTipoEsfera;
}
