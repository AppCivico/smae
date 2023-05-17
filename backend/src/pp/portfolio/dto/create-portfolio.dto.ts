import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { IsOnlyDate } from '../../../common/decorators/IsDateOnly';

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

    @IsOptional()
    @IsInt({ message: '$property| Precisa ser um número inteiro' })
    @Min(1)
    @Max(32)
    nivel_maximo_tarefa?: number

    @IsOptional()
    @IsString({ message: '$property| Descrição precisa ser alfanumérico' })
    @Min(0)
    @Max(2040)
    descricao?: string

    @IsOptional()
    @IsOnlyDate()
    @ValidateIf((object, value) => value !== null)
    data_criacao?: Date | null

    @IsOptional()
    @ArrayMinSize(1, { message: '$property| precisa ter pelo menos um item' })
    @ArrayMaxSize(12, { message: '$property| precisa ter no máximo 12 items' })
    @IsInt({ each: true, message: '$property| valor inválido' })
    orcamento_execucao_disponivel_meses?: number[];
}
