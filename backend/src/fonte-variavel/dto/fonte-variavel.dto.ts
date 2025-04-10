import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFonteVariavelDto {
    @IsString({ message: '$property| Nome: Precisa ser alfanumérico' })
    @MaxLength(255, {message: 'O campo "Nome" deve ter no máximo 255 caracteres'})
    nome: string;
}

export class UpdateFonteVariavelDto extends PartialType(CreateFonteVariavelDto) {}
export class FilterFonteVariavelDto {
    /**
     * Filtrar por id?
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| id' })
    @Type(() => Number)
    id?: number;
}

export class FonteVariavelDto {
    nome: string;
}

export class ListFonteVariavelDto {
    linhas: FonteVariavelDto[];
}
