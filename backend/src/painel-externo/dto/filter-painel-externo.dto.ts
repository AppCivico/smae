import { IsInt, IsOptional } from 'class-validator';

export class FilterPainelExternoDto {
    @IsOptional()
    @IsInt()
    id?: number;
}
