import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreateProjetoProgramaDto {
    @IsString({ message: '$property| Nome: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
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
