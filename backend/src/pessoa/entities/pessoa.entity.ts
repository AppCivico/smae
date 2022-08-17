export class Pessoa {
    id?: number;
    email: string;
    senha: string;
    token_acesso_api?: string;
    nome_exibicao: string;
    nome_completo: string;
    session_id?: number;
    senha_bloqueada: boolean
}
