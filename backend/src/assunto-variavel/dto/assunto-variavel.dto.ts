import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAssuntoVariavelDto {
    @IsString({ message: '$property| Nome: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| Nome: Máximo 250 caracteres' })
    nome: string;
}

export class UpdateAssuntoVariavelDto extends PartialType(CreateAssuntoVariavelDto) {}
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

export class ProjetoAssuntoVariavelDto {
    nome: string;
}

export class ListAssuntoVariavelDto {
    linhas: ProjetoAssuntoVariavelDto[];
}
