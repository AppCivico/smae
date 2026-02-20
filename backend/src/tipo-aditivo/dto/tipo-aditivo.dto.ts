import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

const TipoAditivoTipos = ['Aditivo', 'Reajuste'] as const;

export class CreateTipoAditivoDto {
    @IsString({ message: 'Nome: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    nome: string;

    @IsIn(TipoAditivoTipos, { message: `tipo: Deve ser um dos valores: ${TipoAditivoTipos.join(', ')}` })
    tipo: (typeof TipoAditivoTipos)[number];

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
    @IsInt({ message: 'id' })
    @Type(() => Number)
    id?: number;
}

export class ProjetoTipoAditivoDto {
    id: number;
    nome: string;
    tipo: string;
    habilita_valor: boolean;
    habilita_valor_data_termino: boolean;
}

export class ListTipoAditivoDto {
    linhas: ProjetoTipoAditivoDto[];
}
