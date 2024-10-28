import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAssuntoVariavelDto {
    @IsString({ message: '$property| Nome: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| Nome: Máximo 250 caracteres' })
    nome: string;

    @Type(()=>Number)
    @IsInt({ message: '$property| categoria_assunto_variavel_id' })
    categoria_assunto_variavel_id:number
}

export class UpdateAssuntoVariavelDto extends CreateAssuntoVariavelDto {}
export class FilterAssuntoVariavelDto {
    /**
     * Filtrar por id?
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| id' })
    @Type(() => Number)
    id?: number;
}

export class AssuntoVariavelDto {
    nome: string;
}

export class ListAssuntoVariavelDto {
    linhas: AssuntoVariavelDto[];
}
