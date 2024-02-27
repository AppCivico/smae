import { Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, ValidateIf } from "class-validator";
import { IsOnlyDate } from "src/common/decorators/IsDateOnly";

export class CreateParlamentarDto {
    @IsString({ message: '$property| nome: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| nome: Máximo 250 caracteres' })
    nome: string;

    @IsString({ message: '$property| Nome popular: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| Nome popular: Máximo 250 caracteres' })
    nome_popular?: string;
    
    /**
    * @example YYYY-MM-DD
    */
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    nascimento?: Date;

    @IsOptional()
    @IsString()
    @MaxLength(10, { message: '$property| Nome popular: Máximo 250 caracteres' })
    telefone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(250, { message: '$property| Nome popular: Máximo 250 caracteres' })
    email?: string;
    
    @IsOptional()
    @IsString()
    @MaxLength(250, { message: '$property| Nome popular: Máximo 250 caracteres' })
    atuacao?: string;

    @IsOptional()
    @IsString()
    @MaxLength(250, { message: '$property| Nome popular: Máximo 250 caracteres' })
    biografia?: string | null;

    @IsOptional()
    @IsBoolean()
    em_atividade: boolean

}

export class CreateMandatoDto {

}