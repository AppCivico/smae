import { MaxLength } from "class-validator";

export class IdTituloDto {
    id: number;

    @MaxLength(255, { message: 'O campo "Título" deve ter no máximo 255 caracteres' })
    titulo: string;
}
export class IdTituloOrNullDto {
    id: number;

    @MaxLength(255, { message: 'O campo "Título" deve ter no máximo 255 caracteres' })
    titulo: string | null;
}
