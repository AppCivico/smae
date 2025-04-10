import { ApiProperty } from '@nestjs/swagger';
import { TransferenciaTipoCategoria, TransferenciaTipoEsfera } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTransferenciaTipoDto {
    @IsString()
    @MaxLength(255, {message: 'O campo "Nome" deve ter no máximo 255 caracteres'})
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
