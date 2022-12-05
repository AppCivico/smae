import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from "class-validator";

export class CreateRegiaoDto {
    /**
   * Nivel (1 até 4) [1=cidade, 2=norte/sul, 3=prefeitura, 4=subprefeitura]
   * @example 2
    */
    @IsInt({ message: '$property| Precisa ser um número' })
    @Min(1, { message: "$property| região mínima nível 1" })
    @Max(4, { message: "$property| região máxima nível 4" })
    @Type(() => Number)
    nivel: number;

    /**
      * Código (IBGE, etc)
      * @example 27
       */
    @IsOptional()
    @IsInt({ message: '$property| Precisa ser um número' })
    @Type(() => Number)
    codigo?: number;

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
    @IsInt({ message: '$property| Precisa ser nulo ou o ID' })
    @ValidateIf((object, value) => value !== null)
    parente_id: number | undefined;


    /**
    * Upload do Shapefile
    */
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsString({ message: '$property| upload_token de um arquivo de Shapefile' })
    upload_shapefile?: string | null

}
