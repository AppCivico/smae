import { ApiProperty } from '@nestjs/swagger';
import { TransferenciaTipoCategoria, TransferenciaTipoEsfera } from 'src/generated/prisma/client';

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

export class TransferenciaTipoCurtoDto {
    id: number;
    nome: string;
    @ApiProperty({ enum: TransferenciaTipoEsfera, enumName: 'TransferenciaTipoEsfera' })
    esfera: TransferenciaTipoEsfera;
}
