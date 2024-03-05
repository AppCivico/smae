import { PessoaFisica } from '@prisma/client';
import { OrgaoDto } from '../../orgao/entities/orgao.entity';

export class Pessoa {
    id?: number;
    email: string;
    nome_exibicao: string;
    nome_completo: string;
    lotacao?: string;

    atualizado_em?: Date;

    orgao?: OrgaoDto;

    token_acesso_api?: string;
    session_id?: number;
    senha_bloqueada?: boolean;

    desativado: boolean;

    pessoa_fisica?: PessoaFisica | null;
}
