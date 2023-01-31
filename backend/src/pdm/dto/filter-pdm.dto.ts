import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class FilterPdmDto {
    /**
     * Filtrar Pdm com Ativo?
     * @example "true"
     */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    ativo?: boolean;
}

export class FilterPdmDetailDto {
    /**
     * Incluir dados auxiliares
     * @example "true"
     */
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    incluir_auxiliares?: boolean;
}
