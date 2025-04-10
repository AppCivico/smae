import { MaxLength } from "class-validator";

export class IdSigla {
    id: number;

    @MaxLength(255, { message: 'O campo "Sigla" deve ter no máximo 255 caracteres' })
    sigla: string;
}

export class IdSiglaDescricao {
    id: number;

    @MaxLength(255, { message: 'O campo "Sigla" deve ter no máximo 255 caracteres' })
    sigla: string;

    @MaxLength(2048, { message: 'O campo "Descrição" deve ter no máximo 2048 caracteres' })
    descricao: string;
}
