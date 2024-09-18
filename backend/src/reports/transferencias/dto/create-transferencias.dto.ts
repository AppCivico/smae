import { ApiProperty } from '@nestjs/swagger';
import { TransferenciaInterface, TransferenciaTipoEsfera } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum TipoRelatorioTransferencia {
    'Geral' = 'Geral',
    'Resumido' = 'Resumido',
}

export class CreateRelTransferenciasDto {
    @IsOptional()
    @ApiProperty({ enum: TransferenciaTipoEsfera, enumName: 'TransferenciaTipoEsfera' })
    @IsEnum(TransferenciaTipoEsfera, {
        message:
            '$property| Precisa ser um dos seguintes valores: ' + Object.values(TransferenciaTipoEsfera).join(', '),
    })
    esfera?: TransferenciaTipoEsfera;

    @IsOptional()
    @ApiProperty({ enum: TransferenciaInterface, enumName: 'TransferenciaInterface' })
    @IsEnum(TransferenciaInterface, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(TransferenciaInterface).join(', '),
    })
    interface?: TransferenciaInterface;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    ano?: number;

    @IsOptional()
    @IsNumber()
    @Transform(({ value }: any) => +value)
    partido_id?: number;

    @IsOptional()
    @IsNumber()
    @Transform(({ value }: any) => +value)
    orgao_concedente_id?: number;

    @IsOptional()
    @IsString()
    secretaria_concedente?: string;

    @IsOptional()
    @IsString()
    objeto?: string;

    @IsOptional()
    @IsString()
    gestor_contrato?: string;

    /**
     * @example "Analitico"
     */
    @ApiProperty({ enum: TipoRelatorioTransferencia, enumName: 'TipoRelatorioTransferencia' })
    @IsEnum(TipoRelatorioTransferencia, {
        message:
            '$property| Precisa ser um dos seguintes valores: ' + Object.values(TipoRelatorioTransferencia).join(', '),
    })
    tipo: TipoRelatorioTransferencia;
}
