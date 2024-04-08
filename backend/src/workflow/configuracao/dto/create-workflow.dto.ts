import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, ValidateIf } from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';

export class CreateWorkflowDto {
    @IsNumber()
    transferencia_tipo_id: number;

    /**
     * Início
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    inicio: Date;

    /**
     * Término
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    termino?: Date;
}
