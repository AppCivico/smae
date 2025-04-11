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
    @Transform(({ value }: any) => +value)
    nivel_maximo_tarefa?: number;

    @IsOptional()
    @IsString({ message: '$property| Descrição precisa ser alfanumérico' })
    @MinLength(0)
    @MaxLength(2040)
    descricao?: string;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data_criacao?: Date | null;

    @IsOptional()
    @ArrayMinSize(1, { message: '$property| precisa ter pelo menos um item' })
    @ArrayMaxSize(12, { message: '$property| precisa ter no máximo 12 items' })
    @IsInt({ each: true, message: '$property| valor inválido' })
    orcamento_execucao_disponivel_meses?: number[];

    @IsOptional()
    @IsInt({ message: '$property| Precisa ser um número inteiro' })
    @Min(1)
    @Max(4)
    @Transform(({ value }: any) => +value)
    nivel_regionalizacao?: number;

    @IsOptional()
    @IsArray()
    @IsInt({ message: '$property| Precisa ser uma lista de inteiros', each: true })
    @Max(1000, { each: true })
    grupo_portfolio?: number[];

    @IsOptional()
    @IsBoolean()
    modelo_clonagem?: boolean;
}
