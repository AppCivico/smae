import { IsNumber, IsOptional, IsString, Max, MaxLength } from "class-validator";

export class CreateBancadaDto {
    @IsNumber()
    @Max(99)
    numero: number;

    @IsString({ message: '$property| sigla: Precisa ser alfanumérico' })
    @MaxLength(20, { message: '$property| sigla: Máximo 20 caracteres' })
    sigla: string;
    
    @IsString({ message: '$property| nome: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| nome: Máximo 250 caracteres' })
    nome: string;

    @IsOptional()
    @IsString({ message: '$property| descricao: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| descricao: Máximo 250 caracteres' })
    descricao?: string;
}