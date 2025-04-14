import { Transform } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from '../../../auth/transforms/date.transform';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreatePlanoAcaoDto {
    @IsInt()
    projeto_risco_id: number;

    @IsInt()
    orgao_id: number;

    @IsString()
    @IsOptional()
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Responsável' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    responsavel?: string;

    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Contramedida' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    contramedida: string;

    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    prazo_contramedida: Date | null;

    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsNumber(
        { maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
        { message: '$property| até duas casas decimais' }
    )
    @Min(0, { message: '$property| Valor Empenhado precisa ser positivo ou zero' })
    custo: number | null;

    @IsNumber(
        { maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
        { message: '$property| até duas casas decimais' }
    )
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @Min(0, { message: '$property| Valor Empenhado precisa ser positivo ou zero' })
    @Max(100, { message: '$property| Valor Empenhado precisa até 100' })
    custo_percentual: number | null;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Medidas de Contingência' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    medidas_de_contingencia: string | undefined;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Contato do Responsavel' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    contato_do_responsavel: string;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data_termino: Date | null;
}
