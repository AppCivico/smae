import { Type } from "class-transformer";
import { IsOptional, isPositive, IsPositive, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateRegiaoDto {
    /**
   * Nivel (1 até 3)
   * @example "2"
    */
    @IsPositive()
    @Min(1)
    @Max(3)
    @Type(() => Number)
    nivel: number;

    /**
       * Descrição
       * @example "Subprefeitura da Sé"
    */
    @IsString({ message: '$property| Descrição: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| Descrição: Máximo 250 caracteres' })
    descricao: string;


    /**
       * ID da região acima
    */
    @IsPositive({ message: '$property| Descrição: Precisa ser alfanumérico' })
    parente_id: number;


    /**
       * shapefile
       * @example "{"geojson":"maybe"}"
    */
    @IsOptional()
    @IsString({ message: '$property| Shapefile: Precisa ser alfanumérico' })
    @MaxLength(1000000, { message: '$property| Shapefile: Máximo 1000000 (1MB)' })
    shapefile: string;

}
