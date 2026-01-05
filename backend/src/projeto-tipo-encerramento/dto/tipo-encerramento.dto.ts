import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_LENGTH_MEDIO } from 'src/common/consts';

export class CreateTipoEncerramentoDto {
    @IsString({ message: 'descrição: Precisa ser alfanumérico' })
    @MinLength(1, { message: 'descrição: Mínimo de 1 caractere' })
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao: string;
}

export class TipoEncerramentoDto {
    id: number;
    descricao: string;
}

export class ListTipoEncerramentoDto {
    @ApiProperty({ description: 'Lista de Tipo de Encerramento' })
    linhas: TipoEncerramentoDto[];
}

export class UpdateTipoEncerramentoDto extends PartialType(CreateTipoEncerramentoDto) {}
