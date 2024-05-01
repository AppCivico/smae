import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';
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
    descricao: string;

    @IsString()
    @IsOptional()
    observacao: string;

    @IsNumber()
    @IsOptional()
    sequencial?: number;

    @IsString()
    @IsOptional()
    contexto?: string;

    @IsString()
    @IsOptional()
    resultado?: string;
}
