import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_LENGTH_MEDIO } from 'src/common/consts';
import { Transform } from 'class-transformer';

export class CreateTipoEncerramentoDto {
    @IsString({ message: 'descrição: Precisa ser alfanumérico' })
    @MinLength(1, { message: 'descrição: Mínimo de 1 caractere' })
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao: string;

    @IsOptional()
    @IsBoolean({ message: 'habilitar_info_adicional: Precisa ser um valor booleano' })
    @Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
    habilitar_info_adicional?: boolean;
}

export class TipoEncerramentoDto {
    id: number;
    descricao: string;
    habilitar_info_adicional: boolean;
}

export class ListTipoEncerramentoDto {
    @ApiProperty({ description: 'Lista de Tipo de Encerramento' })
    linhas: TipoEncerramentoDto[];
}

export class UpdateTipoEncerramentoDto extends PartialType(CreateTipoEncerramentoDto) {}
