import { PartialType } from '@nestjs/swagger';
import { IsNumber, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreateClassificacaoDto {
    @IsString({ message: '$property| Nome: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    nome: string;
    @IsNumber()
    transferencia_tipo_id: number;
}

export class UpdateClassificacaoDto extends PartialType(CreateClassificacaoDto) {}
