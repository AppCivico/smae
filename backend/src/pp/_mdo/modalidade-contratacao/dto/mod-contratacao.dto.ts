import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreateModalidadeContratacaoDto {
    @IsString({ message: '$property| Nome: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    nome: string;
}

export class UpdateModalidadeContratacaoDto extends PartialType(CreateModalidadeContratacaoDto) {}
export class FilterModalidadeContratacaoDto {
    /**
     * Filtrar por id?
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| id' })
    @Type(() => Number)
    id?: number;
}

export class ProjetoModalidadeContratacaoDto {
    nome: string;
}

export class ListModalidadeContratacaoDto {
    linhas: ProjetoModalidadeContratacaoDto[];
}
