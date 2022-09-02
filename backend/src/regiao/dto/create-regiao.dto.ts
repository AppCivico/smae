import { Type } from "class-transformer";
import { IsNumber, IsOptional, isPositive, IsPositive, IsString, Max, MaxLength, Min, MinLength, ValidateIf } from "class-validator";

export class CreateRegiaoDto {
    /**
   * Nivel (1 até 3)
   * @example 2
    */
    @IsPositive({ message: '$property| Precisa ser um número' })
    @Min(1, { message: "$property| região mínima nível 1" })
    @Max(3, { message: "$property| região máxima nível 3" })
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
    @IsOptional()
    @IsPositive({ message: '$property| Precisa ser nulo ou o ID' })
    @ValidateIf((object, value) => value !== null)
    parente_id: number | undefined;


    /**
    * Upload do Shapefile
    */
    @IsOptional()
    @IsString({ message: '$property| upload_token de um arquivo de Shapefile' })
    upload_shapefile?: string

}
