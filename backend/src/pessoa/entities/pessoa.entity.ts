export class Pessoa {
    id?: number;
    email: string;
    senha: string;
    eh_super_admin: boolean;
    token_acesso_api?: string;
    nome_exibicao: string;
    nome_completo: string;
}
