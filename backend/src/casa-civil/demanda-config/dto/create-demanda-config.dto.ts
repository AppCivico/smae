import { Transform } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsOptional,
    IsString,
    MaxLength,
    ValidateIf
} from 'class-validator';
import { DateTransform } from 'src/auth/transforms/date.transform';
import { MAX_LENGTH_MEDIO } from 'src/common/consts';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { IsNumberStringCustom } from 'src/common/decorators/IsNumberStringCustom';

export class CreateDemandaConfigDto {
    @IsOnlyDate()
    @Transform(DateTransform)
    data_inicio_vigencia: Date;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data_fim_vigencia?: Date;

    @IsNumberStringCustom(13, 2)
    valor_minimo: string;

    @IsNumberStringCustom(13, 2)
    valor_maximo: string;

    @IsOptional()
    @IsBoolean({ message: 'bloqueio_valor_min precisa ser um booleano' })
    bloqueio_valor_min?: boolean;

    @IsOptional()
    @IsBoolean({ message: 'bloqueio_valor_max precisa ser um booleano' })
    bloqueio_valor_max?: boolean;

    @IsOptional()
    @IsBoolean({ message: 'alerta_valor_min precisa ser um booleano' })
    alerta_valor_min?: boolean;

    @IsOptional()
    @IsBoolean({ message: 'alerta_valor_max precisa ser um booleano' })
    alerta_valor_max?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO, {
        message: `O campo 'Observação' deve ter no máximo ${MAX_LENGTH_MEDIO} caracteres`,
    })
    observacao?: string;

    @IsOptional()
    @IsArray({ message: 'upload_tokens precisa ser um array' })
    @IsString({ each: true, message: 'Cada token precisa ser uma string' })
    upload_tokens?: string[];
}
