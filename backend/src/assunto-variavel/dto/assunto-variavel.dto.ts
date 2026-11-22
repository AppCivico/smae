import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';
import { IdNomeDto } from '../../common/dto/IdNome.dto';

export class CreateAssuntoVariavelDto {
    @IsString({ message: 'Nome: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    nome: string;

    @Type(() => Number)
    @IsInt({ message: 'categoria_assunto_variavel_id' })
    categoria_assunto_variavel_id: number;
}

export class UpdateAssuntoVariavelDto extends CreateAssuntoVariavelDto {}
export class FilterAssuntoVariavelDto {
    /**
     * Filtrar por id?
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: 'id' })
    @Type(() => Number)
    id?: number;
}

export class AssuntoVariavelDto {
    id: number;
    nome: string;
    categoria_assunto_variavel_id: number | null;
    categoria_assunto_variavel: IdNomeDto | null;
    /**
     * Quantidade de variáveis não removidas que usam este assunto
     */
    total_variaveis: number;
}

export class ListAssuntoVariavelDto {
    linhas: AssuntoVariavelDto[];
}
