import { ApiProperty } from '@nestjs/swagger';
import { IndicadorTipo, Periodicidade, Polaridade } from '@prisma/client';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    ValidateIf,
} from 'class-validator';
import { IsOnlyDate } from '../../common/decorators/IsDateOnly';
import { MAX_CASAS_DECIMAIS } from '../../variavel/dto/create-variavel.dto';
import { DateTransform } from '../../auth/transforms/date.transform';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_MEDIO } from 'src/common/consts';

export class CreateIndicadorDto {
    /**
     * Código
     */
    @IsString({ message: '$property| Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Código' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    codigo: string;

    /**
     * título
     */
    @IsString({ message: '$property| Título: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo 'Título' deve ter no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    titulo: string;

    /**
     * Polaridade
     * @example Neutra
     * */
    @ApiProperty({ enum: Polaridade, enumName: 'Polaridade' })
    @IsEnum(Polaridade, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(Polaridade).join(', '),
    })
    polaridade: Polaridade;

    /**
     * @example Mensal
     * */
    @ApiProperty({ enum: Periodicidade, enumName: 'Periodicidade' })
    @IsEnum(Periodicidade, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(Periodicidade).join(', '),
    })
    periodicidade: Periodicidade;

    /**
     * regionalizavel
     */
    @IsBoolean({ message: '$property| precisa ser um boolean' })
    regionalizavel: boolean;

    /**
     * nivel_regionalizacao
     */
    @IsOptional()
    @IsInt({ message: '$property| nivel_regionalizacao precisa ser um número ou null' })
    @ValidateIf((object, value) => value !== null)
    @Min(1)
    @Type(() => Number)
    nivel_regionalizacao?: number | null;

    /**
     * inicio_medicao
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    inicio_medicao: Date;

    /**
     * fim_medicao
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    fim_medicao: Date;

    /**
     * meta_id
     */
    @IsInt({ message: '$property| precisa ser um número' })
    @Type(() => Number)
    @IsOptional()
    meta_id?: number;

    /**
     * iniciativa_id
     */
    @IsInt({ message: '$property| precisa ser um número' })
    @Type(() => Number)
    @IsOptional()
    iniciativa_id?: number;

    /**
     * atividade_id
     */
    @IsInt({ message: '$property| precisa ser um número' })
    @Type(() => Number)
    @IsOptional()
    atividade_id?: number;

    @IsOptional()
    @IsString({ message: '$property| Precisa ser uma string' })
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Contexto" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    contexto?: string | null;

    @IsOptional()
    @IsString({ message: '$property| Precisa ser uma string' })
    complemento?: string | null;

    @IsInt({ message: '$property| $property inválido' })
    @Min(0, { message: '$property| casas_decimais tem valor mínimo de zero' })
    @Max(MAX_CASAS_DECIMAIS, { message: `$property| casas_decimais tem valor máximo de ${MAX_CASAS_DECIMAIS}` })
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    @ValidateIf((object, value) => value !== null)
    casas_decimais: number | null;

    @IsOptional()
    @IsEnum(IndicadorTipo, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(IndicadorTipo).join(', '),
    })
    @ApiProperty({ enum: IndicadorTipo, enumName: 'IndicadorTipo' })
    indicador_tipo?: IndicadorTipo;
}

export class LinkIndicadorVariavelDto {
    @IsArray({ message: '$property| precisa ser um array' })
    @IsInt({ each: true, message: '$property| precisa ser um número' })
    variavel_ids: number[];
}

export class UnlinkIndicadorVariavelDto {
    @IsInt({ message: '$property| precisa ser um número' })
    variavel_id: number;
}
