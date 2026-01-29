import {
    IsOptional,
    IsInt,
    IsNumberString,
    ValidateIf,
    IsNumber,
    Max,
    Min,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';
import { DateTransform } from 'src/auth/transforms/date.transform';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { IsNumberStringCustom } from 'src/common/decorators/IsNumberStringCustom';
import { Transform, Type } from 'class-transformer';
import { PositiveNumberTransformOrUndef } from 'src/auth/transforms/number.transform';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreateContratoAditivoDto {
    @IsInt()
    @Type(() => Number)
    tipo_aditivo_id: number;

    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Número' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    numero: string;

    @Transform(DateTransform)
    @IsOnlyDate()
    data: Date;

    @IsOptional()
    @Transform(DateTransform)
    @IsOnlyDate()
    data_termino_atualizada?: Date;

    @IsOptional()
    @IsNumberStringCustom(35, 30)
    @ValidateIf((object, value) => value !== null)
    valor?: number;

    @IsNumber(
        { maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
        { message: 'até duas casas decimais' }
    )
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @Min(0, { message: 'precisa ser positivo ou zero' })
    @Max(100, { message: 'Máximo é 100' })
    @Transform(PositiveNumberTransformOrUndef)
    percentual_medido?: number;
}
