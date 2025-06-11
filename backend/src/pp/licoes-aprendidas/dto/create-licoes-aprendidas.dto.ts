import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from '../../../auth/transforms/date.transform';
import { MAX_LENGTH_MEDIO } from 'src/common/consts';

export class CreateLicoesApreendidasDto {
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data_registro: Date;

    @IsString()
    responsavel: string;

    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao: string;

    @IsString()
    @IsOptional()
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    observacao: string;

    @IsNumber()
    @IsOptional()
    sequencial?: number;

    @IsString()
    @IsOptional()
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo 'Contexto' deve ter no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    contexto?: string;

    @IsString()
    @IsOptional()
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Resultado" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    resultado?: string;
}
