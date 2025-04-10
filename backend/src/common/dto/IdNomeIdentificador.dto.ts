import { MaxLength } from "class-validator";

export class IdNomeIdentificadorDto {
    id: number;

    @MaxLength(255, { message: 'O campo "Nome" deve ter no máximo 255 caracteres' })
    nome: string;

    @MaxLength(255, { message: 'O campo "Identificador" deve ter no máximo 255 caracteres' })
    identificador: string;
}
