import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';
import { IsOnlyDate } from '../../common/decorators/IsDateOnly';

export class CreateEtapaDto {
    /**
     * lista dos responsáveis pelo preenchimento. Pelo menos uma pessoa
     * @example "[4, 5, 6]"
     */
    @IsOptional()
    @IsArray({ message: '$property| precisa ser um array' })
    @ArrayMaxSize(100, { message: '$property| precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    responsaveis?: number[];

    /**
     * etapa_pai_id
     */
    @IsInt({ message: '$property| Etapa pai precisa ser um número ou null' })
    @Type(() => Number)
    @IsOptional()
    etapa_pai_id?: number;

    /**
     * regiao_id
     */
    @IsInt({ message: '$property| região precisa ser um número ou null' })
    @Type(() => Number)
    @IsOptional()
    regiao_id?: number;

    /**
     * descricao
     */
    @IsString({ message: '$property| contexto: Precisa ser alfanumérico' })
    @IsOptional()
    descricao?: string;

    /**
     * status
     */
    @IsString({ message: '$property| status: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| status: pelo menos um caractere' })
    @IsOptional()
    @MaxLength(250, { message: '$property| status: 250 caracteres' })
    status?: string;

    @IsNumber()
    @IsInt({ message: '$property| ordem precisa ser um número ou null' })
    @IsOptional()
    ordem?: number;

    /**
     * titulo
     */
    @IsString({ message: '$property| titulo: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| titulo: pelo menos um caractere' })
    @IsOptional()
    @MaxLength(250, { message: '$property| titulo: 250 caracteres' })
    titulo?: string;

    /**
     * inicio_previsto
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    inicio_previsto?: Date | null;

    /**
     * termino_previsto
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    termino_previsto?: Date | null;

    /**
     * inicio_real
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    inicio_real?: Date | null;

    /**
     * termino_real
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    termino_real?: Date | null;

    /**
     * prazo_inicio
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    prazo_inicio?: Date | null;

    /**
     * prazo_termino
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    prazo_termino?: Date | null;

    @IsOptional()
    @IsInt({ message: '$property| Peso precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    peso?: number;

    @IsOptional()
    @IsNumber()
    @ValidateIf((object, value) => value !== null)
    @Min(0, { message: '$property| Percentual de execução precisa ser positivo ou zero' })
    @Max(100, { message: '$property| Percentual de execução máximo é 100' })
    percentual_execucao?: number
}
