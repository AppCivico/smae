import { IdSigla } from './IdSigla.dto';

export class IdNomeExibicaoDto {
    id: number;
    nome_exibicao: string;
}

export class IdNomeExibicaoOrgaoDto {
    id: number;
    nome_exibicao: string;
    orgao: IdSigla;
}
