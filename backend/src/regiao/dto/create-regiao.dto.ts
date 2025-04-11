import { PartialType, PickType } from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';

export class CreateRegiaoDto {
    /**
     * Nivel (1 até 4) [1=cidade, 2=norte/sul, 3=prefeitura, 4=subprefeitura]
     * @example 2
     */
    @IsInt({ message: '$property| Precisa ser um número' })
    @Min(1, { message: '$property| região mínima nível 1' })
    @Max(4, { message: '$property| região máxima nível 4' })
    @Type(() => Number)
    nivel: number;

    /**
     * Código (IBGE, etc)
     * @example 27
     */
    @IsOptional()
    @IsString({ message: '$property| Precisa ser um texto' })
    @MaxLength(100)
    codigo?: string;

    /**
     * Descrição
     * @example "Subprefeitura da Sé"
     */
    @IsString({ message: '$property| Descrição: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| Descrição: Máximo 250 caracteres' })
    descricao: string;

    @IsOptional()
    @IsString({ message: 'Usado na geração de novas variaveis' })
    @MaxLength(25, { message: 'Código sufixo: Máximo 25 caracteres' })
    pdm_codigo_sufixo?: string;

    /**
     * ID da região acima
     */
    @IsOptional()
    @IsInt({ message: '$property| Precisa ser nulo ou o ID' })
    @ValidateIf((object, value) => value !== null)
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    parente_id: number | undefined;

    /**
     * Upload do Shapefile
     */
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsString({ message: '$property| upload_token de um arquivo de Shapefile' })
    upload_shapefile?: string | null;
}

export class FilterRegiaoDto extends PartialType(PickType(CreateRegiaoDto, ['nivel', 'parente_id'])) {}
