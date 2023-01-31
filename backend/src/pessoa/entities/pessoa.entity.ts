import { PessoaFisica } from '@prisma/client';
import { Orgao } from '../../orgao/entities/orgao.entity';

export class Pessoa {
    id?: number;
    email: string;
    nome_exibicao: string;
    nome_completo: string;
    lotacao?: string;

    atualizado_em?: Date;

    orgao?: Orgao;

    token_acesso_api?: string;
    session_id?: number;
    senha_bloqueada?: boolean;

    desativado: boolean;

    pessoa_fisica?: PessoaFisica | null;
}
