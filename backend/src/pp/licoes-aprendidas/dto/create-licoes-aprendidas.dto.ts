import { Type } from "class-transformer";
import { IsOptional, IsString, ValidateIf } from "class-validator";
import { IsOnlyDate } from "src/common/decorators/IsDateOnly";

export class CreateLicoesApreendidasDto {
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    data_registro: Date

    @IsString()
    responsavel: string

    @IsString()
    descricao: string

    @IsString()
    @IsOptional()
    observacao: string
}