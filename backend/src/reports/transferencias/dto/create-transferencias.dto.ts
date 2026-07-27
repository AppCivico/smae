import { ApiProperty } from '@nestjs/swagger';
import { TransferenciaInterface, TransferenciaTipoEsfera } from '@prisma/client';
import { Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_MEDIO } from 'src/common/consts';
import { OptionalBooleanTransform } from 'src/auth/transforms/boolean.transform';

export enum TipoRelatorioTransferencia {
    'Geral' = 'Geral',
    'Resumido' = 'Resumido',
}

export class CreateRelTransferenciasDto {
    @IsOptional()
    @ApiProperty({ enum: TransferenciaTipoEsfera, enumName: 'TransferenciaTipoEsfera' })
    @IsEnum(TransferenciaTipoEsfera, {
        message: 'Precisa ser um dos seguintes valores: ' + Object.values(TransferenciaTipoEsfera).join(', '),
    })
    @Expose()
    esfera?: TransferenciaTipoEsfera;

    @IsOptional()
    @ApiProperty({ enum: TransferenciaInterface, enumName: 'TransferenciaInterface' })
    @IsEnum(TransferenciaInterface, {
        message: 'Precisa ser um dos seguintes valores: ' + Object.values(TransferenciaInterface).join(', '),
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
     * Quando `true`, inclui transferências canceladas e distribuições canceladas/declinadas/
     * impedidas tecnicamente/redirecionadas. Padrão (`false`/ausente): não apresenta essas linhas.
     */
    @IsOptional()
    @IsBoolean()
    @Transform(OptionalBooleanTransform)
    @Expose()
    cancelada?: boolean;

    /**
     * @example "Analitico"
     */
    @ApiProperty({ enum: TipoRelatorioTransferencia, enumName: 'TipoRelatorioTransferencia' })
    @IsEnum(TipoRelatorioTransferencia, {
        message: 'Precisa ser um dos seguintes valores: ' + Object.values(TipoRelatorioTransferencia).join(', '),
    })
    @Expose()
    tipo: TipoRelatorioTransferencia;
}
