import { IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreateTipoIntervencaoDto {
    @IsString({ message: '$property| nome: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    nome: string;

    @IsOptional()
    @IsString({ message: '$property| conceito: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Conceito' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    conceito?: string;
}
