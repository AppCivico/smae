import { PartialType } from '@nestjs/swagger';
import { IsNumber, IsString, MaxLength } from 'class-validator';

export class CreateClassificacaoDto {
    @IsString({ message: '$property| Nome: Precisa ser alfanumérico' })
    @MaxLength(255, { message: 'O campo "Nome" deve ter no máximo 255 caracteres' })
    nome: string;
    @IsNumber()
    transferencia_tipo_id: number;
}

export class UpdateClassificacaoDto extends PartialType(CreateClassificacaoDto) {}
