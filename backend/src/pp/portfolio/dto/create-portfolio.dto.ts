import { Transform } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    MinLength,
    ValidateIf,
} from 'class-validator';
import { DateTransform } from '../../../auth/transforms/date.transform';
import { IsOnlyDate } from '../../../common/decorators/IsDateOnly';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_MEDIO } from 'src/common/consts';

export class CreatePortfolioDto {
    /**
     * Sigla
     */
    @IsString({ message: 'sigla: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Título' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    titulo: string;

    /**
     * órgãos que serão exibidos para os participantes
     * @example "[1, 2, 3]"
     */
    @IsArray({ message: 'órgãos: precisa ser uma array, campo obrigatório' })
    @ArrayMinSize(1, { message: 'órgãos: precisa ter pelo menos um item' })
    @ArrayMaxSize(100, { message: 'órgãos: precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: 'Cada item precisa ser um número inteiro' })
    orgaos: number[];

    @IsOptional()
    @IsInt({ message: 'Precisa ser um número inteiro' })
    @Min(1)
    @Max(32)
    @Transform(({ value }: any) => +value)
    nivel_maximo_tarefa?: number;

    @IsOptional()
    @IsString({ message: 'Descrição precisa ser alfanumérico' })
    @MinLength(0)
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao?: string;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data_criacao?: Date | null;

    @IsOptional()
    @ArrayMinSize(1, { message: 'precisa ter pelo menos um item' })
    @ArrayMaxSize(12, { message: 'precisa ter no máximo 12 items' })
    @IsInt({ each: true, message: 'valor inválido' })
    orcamento_execucao_disponivel_meses?: number[];

    @IsOptional()
    @IsInt({ message: 'Precisa ser um número inteiro' })
    @Min(1)
    @Max(4)
    @Transform(({ value }: any) => +value)
    nivel_regionalizacao?: number;

    @IsOptional()
    @IsArray()
    @IsInt({ message: 'Precisa ser uma lista de inteiros', each: true })
    @Max(1000, { each: true })
    grupo_portfolio?: number[];

    @IsOptional()
    @IsBoolean()
    modelo_clonagem?: boolean;
}
