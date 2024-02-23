import { IsNumber, IsOptional, IsString, MaxLength } from "class-validator";
import { IsOnlyDate } from "src/common/decorators/IsDateOnly";

export class CreatePartidoDto {
    @IsNumber()
    @MaxLength(2)
    numero: number;

    @IsString({ message: '$property| sigla: Precisa ser alfanumérico' })
    @MaxLength(20, { message: '$property| sigla: Máximo 20 caracteres' })
    sigla: string;
    
    @IsString({ message: '$property| nome: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| nome: Máximo 250 caracteres' })
    nome: string;

    @IsOptional()
    @IsString({ message: '$property| observação: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| observação: Máximo 250 caracteres' })
    observacao?: string;

    @IsOptional()
    @IsOnlyDate()
    fundacao?: Date;

    @IsOptional()
    @IsOnlyDate()
    encerramento?: Date;
}