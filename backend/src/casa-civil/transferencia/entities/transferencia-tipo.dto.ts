import { ApiProperty } from '@nestjs/swagger';
import { TransferenciaTipoCategoria, TransferenciaTipoEsfera } from '@prisma/client';

export class TransferenciaTipoDto {
    id: number;
    nome: string;
    @ApiProperty({ enum: TransferenciaTipoCategoria, enumName: 'TransferenciaTipoCategoria' })
    categoria: TransferenciaTipoCategoria;
    @ApiProperty({ enum: TransferenciaTipoEsfera, enumName: 'TransferenciaTipoEsfera' })
    esfera: TransferenciaTipoEsfera;
}

export class ListTransferenciaTipoDto {
    linhas: TransferenciaTipoDto[];
}
