import { ModuloSistema, PessoaFisica, TipoPdm } from '@prisma/client';

export class Pessoa {
    id?: number;
    email: string;
    nome_exibicao: string;
    nome_completo: string;
    lotacao?: string;

    atualizado_em?: Date;

    token_acesso_api?: string;
    session_id?: number;
    senha_bloqueada?: boolean;
    senha_bloqueada_em: Date | null;

    desativado: boolean;

    pessoa_fisica: PessoaFisica | null;
    equipe_pdm_tipos: TipoPdm[];
    sobreescrever_modulos: boolean;
    modulos_permitidos: ModuloSistema[];
}
