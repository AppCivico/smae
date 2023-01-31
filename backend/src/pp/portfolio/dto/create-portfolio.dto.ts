import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePortfolioDto {
    /**
     * Sigla
     */
    @IsString({ message: '$property| sigla: Precisa ser alfanumérico' })
    @MaxLength(200, { message: '$property| sigla: Máximo 200 caracteres' })
    titulo: string;

    /**
     * órgãos que serão exibidos para os participantes
     * @example "[1, 2, 3]"
     */
    @IsArray({ message: '$property| órgãos: precisa ser uma array, campo obrigatório' })
    @ArrayMinSize(1, { message: '$property| órgãos: precisa ter pelo menos um item' })
    @ArrayMaxSize(100, { message: '$property| órgãos: precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    orgaos: number[];
}
