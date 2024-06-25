import { Type } from 'class-transformer';
import { IsInt, IsOptional, ValidateIf } from 'class-validator';

export class FilterDistribuicaoStatusDto {
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    tipo_transferencia_id: number;
}
