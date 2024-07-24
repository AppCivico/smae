import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { NumberTransform } from '../../auth/transforms/number.transform';

export class FilterPdmDto {
    /**
     * Filtrar Pdm com Ativo?
     * @example "true"
     */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    ativo?: boolean;

    @IsOptional()
    @Transform(NumberTransform)
    id?: number;
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
