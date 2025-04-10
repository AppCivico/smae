import { IsBoolean, IsString, MaxLength } from 'class-validator';

export class CreateGrupoPaineisDto {
    /**
     * nome
     */
    @IsString({ message: '$property| Precisa ser alfanumérico' })
    @MaxLength(255, {message: 'O campo "Nome" deve ter no máximo 255 caracteres'})
    nome: string;

    /**
     * ativo
     */
    @IsBoolean()
    ativo: boolean;
}
