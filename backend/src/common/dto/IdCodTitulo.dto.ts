import { MaxLength } from "class-validator";

export class IdCodTituloDto {
    id: number;

    @MaxLength(255, { message: 'O campo "Código" deve ter no máximo 255 caracteres' })
    codigo: string;

    @MaxLength(255, { message: 'O campo "Título" deve ter no máximo 255 caracteres' })
    titulo: string;
}
