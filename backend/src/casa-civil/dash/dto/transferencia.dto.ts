import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

import { TransferenciaTipoEsfera } from '@prisma/client';
import { Transform } from 'class-transformer';
import { NumberArrayTransform } from '../../../auth/transforms/number-array.transform';

export class MfDashTransferenciasDto {
    transferencia_id: number;
    identificador: string;
    situacao: string;
    data: Date | null;
    data_origem: string;
}

export class ListMfDashTransferenciasDto {
    linhas: MfDashTransferenciasDto[];
}

export class FilterDashTransferenciasDto {
    @IsOptional()
    @ApiProperty({ enum: TransferenciaTipoEsfera, enumName: 'TransferenciaTipoEsfera' })
    esfera?: TransferenciaTipoEsfera;
    @ApiProperty({ description: 'Contém qualquer um dos partidos' })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @Transform(NumberArrayTransform)
    partido_ids?: number[];

    @IsOptional()
    @IsString()
    situacao?: string;

    @ApiProperty({ description: 'Contém qualquer um dos órgãos' })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @Transform(NumberArrayTransform)
    orgaos_ids?: number[];
}
