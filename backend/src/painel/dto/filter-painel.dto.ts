import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class FilterPainelDto {
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    ativo?: boolean;

    @IsNumber()
    @IsOptional()
    meta_id: number
}

export class FilterPainelDaMetaDto {
    @IsNumber()
    @Transform(({ value }: any) => +value)
    meta_id: number
}
