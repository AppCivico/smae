import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class FilterPainelDto {
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    ativo?: boolean;

    @IsOptional()
    @IsNumber()
    @Transform((a: any) => (a.value === '' ? undefined : +a.value))
    meta_id?: number
}

export class FilterPainelDaMetaDto {
    @IsNumber()
    @Transform(({ value }: any) => +value)
    meta_id: number
}
