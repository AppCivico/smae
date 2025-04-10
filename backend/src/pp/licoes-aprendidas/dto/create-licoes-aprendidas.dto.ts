import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from '../../../auth/transforms/date.transform';

export class CreateLicoesApreendidasDto {
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data_registro: Date;

    @IsString()
    responsavel: string;

    @IsString()
    @MaxLength(2048, { message: 'O campo "Descrição" deve ter no máximo 2048 caracteres' })
    descricao: string;

    @IsString()
    @IsOptional()
    @MaxLength(255, { message: 'O campo "Observação" deve ter no máximo 255 caracteres' })
    observacao: string;

    @IsNumber()
    @IsOptional()
    sequencial?: number;

    @IsString()
    @IsOptional()
    @MaxLength(255, { message: 'O campo "Contexto" deve ter no máximo 255 caracteres' })
    contexto?: string;

    @IsString()
    @IsOptional()
    @MaxLength(255, { message: 'O campo "Resultado" deve ter no máximo 255 caracteres' })
    resultado?: string;
}
