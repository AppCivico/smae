import { ApiProperty } from '@nestjs/swagger';
import { TransferenciaInterface, TransferenciaTipoEsfera } from 'src/generated/prisma/client';
import { Expose, Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_MEDIO } from 'src/common/consts';

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
    @Expose()
    esfera?: TransferenciaTipoEsfera;

    @IsOptional()
    @ApiProperty({ enum: TransferenciaInterface, enumName: 'TransferenciaInterface' })
    @IsEnum(TransferenciaInterface, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(TransferenciaInterface).join(', '),
    })
    @Expose()
    interface?: TransferenciaInterface;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Expose()
    ano?: number;

    @IsOptional()
    @IsNumber()
    @Expose()
    partido_id?: number;

    @IsOptional()
    @IsNumber()
    @Expose()
    orgao_concedente_id?: number;

    @IsOptional()
    @IsString()
    @Expose()
    secretaria_concedente?: string;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO, {
        message: `O campo 'Objeto/Empreendimento' deve ter no máximo ${MAX_LENGTH_MEDIO} caracteres`,
    })
    objeto?: string;

    @IsOptional()
    @IsString()
    @Expose()
    gestor_contrato?: string;

    @IsOptional()
    @IsInt()
    @Expose()
    orgao_gestor_id?: number;

    @IsOptional()
    @IsInt()
    @Expose()
    parlamentar_id?: number;

    /**
     * @example "Analitico"
     */
    @ApiProperty({ enum: TipoRelatorioTransferencia, enumName: 'TipoRelatorioTransferencia' })
    @IsEnum(TipoRelatorioTransferencia, {
        message:
            '$property| Precisa ser um dos seguintes valores: ' + Object.values(TipoRelatorioTransferencia).join(', '),
    })
    @Expose()
    tipo: TipoRelatorioTransferencia;
}
