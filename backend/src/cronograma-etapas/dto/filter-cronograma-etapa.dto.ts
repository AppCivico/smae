import { ApiHideProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional } from "class-validator";

export class FilterCronogramaEtapaDto {
    /**
   * Filtrar por cronograma_id?
   * @example "1"
    */
    @IsInt({ message: '$property| cronograma_id' })
    @Type(() => Number)
    cronograma_id: number;

    /**
    * Filtrar por etapa_id?
    * @example "1"
    */
    @IsOptional()
    @IsInt({ message: '$property| etapa_id' })
    @Type(() => Number)
    etapa_id?: number;

    @IsOptional()
    @IsBoolean({ message: '$property| Precisa ser um boolean' })
    @Transform(({ value }: any) => value === 'true')
    inativo?: boolean

    // filtro usado apenas internamente na parte do monitoramento, para forçar um
    // filtro por determinadas etapas
    @ApiHideProperty()
    cronograma_etapa_ids?: number[];
}
