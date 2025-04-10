import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTipoOrgaoDto {
    /**
     * Tipo do Órgão
     * @example "Empresa Pública"
     */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| descrição: Mínimo de 1 caractere' })
    @MaxLength(2048, { message: 'O campo "Descrição" precisa ter no máximo 2048 caracteres' })
    descricao: string;
}
