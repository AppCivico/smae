import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProjetoProgramaDto {
    @IsString({ message: '$property| Nome: Precisa ser alfanumérico' })
    @MaxLength(255, { message: 'O campo "Nome" deve ter no máximo 255 caracteres' })
    nome: string;
}

export class UpdateProgramaDto extends PartialType(CreateProjetoProgramaDto) {}
export class FilterProjetoProgramaDto {
    /**
     * Filtrar por id?
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| id' })
    @Type(() => Number)
    id?: number;
}

export class ProjetoProgramaDto {
    id: number;
    nome: string;
}

export class ListProjetoProgramaDto {
    linhas: ProjetoProgramaDto[];
}
