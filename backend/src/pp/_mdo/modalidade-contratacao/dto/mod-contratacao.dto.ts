import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateModalidadeContratacaoDto {
    @IsString({ message: '$property| Nome: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| Nome: Máximo 250 caracteres' })
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
