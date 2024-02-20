import { Transform, TransformFnParams } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class FilterPainelExternoDto {
    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    id?: number;
}
