import { MaxLength } from "class-validator";

export class IdCodNomeDto {
    id: number;

    @MaxLength(255, { message: 'O campo "Código" deve ter no máximo 255 caracteres' })
    codigo: string | null;

    @MaxLength(255, { message: 'O campo "Nome" deve ter no máximo 255 caracteres' })
    nome: string;
}
