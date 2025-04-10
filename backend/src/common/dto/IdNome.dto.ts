import { MaxLength } from 'class-validator';

export class IdNomeDto {
    id: number;

    @MaxLength(255, {message: 'O campo "Nome" deve ter no máximo 255 caracteres'})
    nome: string;
}
