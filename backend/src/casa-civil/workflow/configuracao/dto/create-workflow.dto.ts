import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { DateTransform } from 'src/auth/transforms/date.transform';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';

export class CreateWorkflowDto {
    @IsNumber()
    transferencia_tipo_id: number;

    @IsString()
    @MinLength(1)
    @MaxLength(250)
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
}
