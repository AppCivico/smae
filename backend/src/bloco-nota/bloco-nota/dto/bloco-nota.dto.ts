import { OmitType, PartialType } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBlocoNotaDto {
    /**
     * Descrição
     */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| descrição: Mínimo 1 caracteres' })
    @MaxLength(100, { message: '$property| descrição: Máximo 100 caracteres' })
    bloco: string;
}

export class UpdateBlocoNotaDto extends OmitType(PartialType(CreateBlocoNotaDto), []) {}

export class ListBlocoNotaDto {
    linhas: BlocoNotaItem[];
}

export class BlocoNotaItem {
    bloco: string;
}
