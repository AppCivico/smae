import { MaxLength } from 'class-validator';
import { IdSigla } from './IdSigla.dto';

export class IdNomeExibicaoDto {
    id: number;

    @MaxLength(255, { message: 'O campo "Nome exibição" deve ter no máximo 255 caracteres' })
    nome_exibicao: string;
}

export class IdNomeExibicaoOrgaoDto {
    id: number;

    @MaxLength(255, { message: 'O campo "Nome exibição" deve ter no máximo 255 caracteres' })
    nome_exibicao: string;
    orgao: IdSigla;
}
