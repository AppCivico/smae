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
import { Transform, Type } from 'class-transformer';
import { PositiveNumberTransformOrUndef } from 'src/auth/transforms/number.transform';

export class CreateContratoAditivoDto {
    @IsInt()
    @Type(() => Number)
    tipo_aditivo_id: number;

    @IsString()
    @MinLength(1)
    @MaxLength(500)
    numero: string;

    @Transform(DateTransform)
    @IsOnlyDate()
    data: Date;

    @IsOptional()
    @Transform(DateTransform)
    @IsOnlyDate()
    data_termino_atualizada?: Date;

    @IsOptional()
    @IsNumberString(
        {},
        {
            message:
                '$property| Precisa ser um número com até 35 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String',
        }
    )
    @ValidateIf((object, value) => value !== null)
    valor?: number;

    @IsNumber(
        { maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
        { message: '$property| até duas casas decimais' }
    )
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @Min(0, { message: '$property| precisa ser positivo ou zero' })
    @Max(100, { message: '$property| Máximo é 100' })
    @Transform(PositiveNumberTransformOrUndef)
    percentual_medido?: number;
}
