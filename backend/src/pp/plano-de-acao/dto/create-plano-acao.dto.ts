import { Transform } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from '../../../auth/transforms/date.transform';

export class CreatePlanoAcaoDto {
    @IsInt()
    projeto_risco_id: number;

    @IsInt()
    orgao_id: number;

    @IsString()
    @IsOptional()
    @MaxLength(255, { message: 'O campo "Responsável" deve ter no máximo 255 caracteres' })
    responsavel?: string;

    @IsString()
    @MaxLength(255, { message: 'O campo "Contra-medida" deve ter no máximo 255 caracteres' })
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
    @MaxLength(255, { message: 'O campo "Medidas de Contingência" deve ter no máximo 255 caracteres' })
    medidas_de_contingencia: string | undefined;

    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'O campo "Contato do Responsável" deve ter no máximo 255 caracteres' })
    contato_do_responsavel: string;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data_termino: Date | null;
}
