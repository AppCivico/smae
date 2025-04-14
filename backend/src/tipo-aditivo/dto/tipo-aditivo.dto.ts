import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreateTipoAditivoDto {
    @IsString({ message: '$property| Nome: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    nome: string;

    @IsBoolean()
    habilita_valor: boolean;

    @IsBoolean()
    habilita_valor_data_termino: boolean;
}

export class UpdateTipoAditivoDto extends PartialType(CreateTipoAditivoDto) {}
export class FilterTipoAditivoDto {
    /**
     * Filtrar por id?
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| id' })
    @Type(() => Number)
    id?: number;
}

export class ProjetoTipoAditivoDto {
    id: number;
    nome: string;
    habilita_valor: boolean;
    habilita_valor_data_termino: boolean;
}

export class ListTipoAditivoDto {
    linhas: ProjetoTipoAditivoDto[];
}
