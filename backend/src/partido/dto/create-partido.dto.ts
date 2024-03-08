import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength } from "class-validator";
import { IsOnlyDate } from "src/common/decorators/IsDateOnly";

export class CreatePartidoDto {
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
    @IsString({ message: '$property| observação: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| observação: Máximo 250 caracteres' })
    observacao?: string;

    /**
     * fundação do partido
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    fundacao?: Date;

    /**
     * encerramento do partido
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    encerramento?: Date;

    @IsOptional()
    @IsArray({ message: '$property| precisa ser um array' })
    @ArrayMaxSize(100, { message: '$property| precisa ter no máximo 100 items' })
    @ArrayMinSize(1, { message: '$property| precisa ter no mínimo 1 item' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    bancadas_id?: number[];
}