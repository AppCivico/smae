import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { DateTransform } from 'src/auth/transforms/date.transform';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';

export class CreateWorkflowDto {
    @IsNumber()
    transferencia_tipo_id: number;

    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    nome: string;

    /**
     * Início
     * @example YYYY-MM-DD
     */
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    inicio: Date;

    /**
     * Término
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    termino?: Date;

    /**
     * IDs de statuses base de distruibuição.
     * @example "[1, 2, 3]"
     */
    @IsOptional()
    @IsArray()
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    distribuicao_statuses_base?: number[];

    /**
     * IDs de statuses customizados de distruibuição.
     * @example "[1, 2, 3]"
     */
    @IsOptional()
    @IsArray()
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    distribuicao_statuses_customizados?: number[];
}
