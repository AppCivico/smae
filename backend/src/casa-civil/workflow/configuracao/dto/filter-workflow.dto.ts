import { Transform, TransformFnParams, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { TransferenciaTipoEsfera } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class FilterWorkflowDto {
    @IsOptional()
    @IsBoolean({ message: 'Precisa ser um boolean' })
    @Transform(({ value }: any) => value === 'true')
    ativo?: boolean;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    transferencia_tipo_id?: number;

    @IsOptional()
    @ApiProperty({ enum: TransferenciaTipoEsfera, enumName: 'TransferenciaTipoEsfera' })
    @IsEnum(TransferenciaTipoEsfera)
    esfera?: TransferenciaTipoEsfera;

    /**
     * Itens por página, padrão 25
     * @example "25"
     */
    @IsOptional()
    @IsInt()
    @Max(500)
    @Min(1)
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    ipp?: number;

    /**
     * Número da página, padrão 1
     * @example "1"
     */
    @IsOptional()
    @IsInt()
    @Min(1)
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    pagina?: number;

    /**
     * Token de paginação
     */
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    token_paginacao?: string;
}

export class FilterWorkflowEtapaDto {
    @IsOptional()
    @IsBoolean({ message: 'Precisa ser um boolean' })
    @Transform(({ value }: any) => value === 'true')
    incluir_removidas?: boolean;
}
