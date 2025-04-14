import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreateAssuntoVariavelDto {
    @IsString({ message: '$property| Nome: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    nome: string;

    @Type(() => Number)
    @IsInt({ message: '$property| categoria_assunto_variavel_id' })
    categoria_assunto_variavel_id: number;
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
