import { ModuloSistema, PerfilResponsavelEquipe, PessoaFisica } from '@prisma/client';
import { MaxLength } from 'class-validator';

export class Pessoa {
    id?: number;

    @MaxLength(255, { message: 'O campo "E-mail" deve ter no máximo 255 caracteres' })
    email: string;

    @MaxLength(255, { message: 'O campo "Nome exibição" deve ter no máximo 255 caracteres' })
    nome_exibicao: string;

    @MaxLength(255, { message: 'O campo "Nome completo" deve ter no máximo 255 caracteres' })
    nome_completo: string;

    @MaxLength(255, { message: 'O campo "Lotação" deve ter no máximo 255 caracteres' })
    lotacao?: string;

    atualizado_em?: Date;
    token_acesso_api?: string;
    session_id?: number;
    senha_bloqueada?: boolean;
    senha_bloqueada_em: Date | null;

    desativado: boolean;

    pessoa_fisica: PessoaFisica | null;
    perfis_equipe_pdm: PerfilResponsavelEquipe[];
    perfis_equipe_ps: PerfilResponsavelEquipe[];
    sobreescrever_modulos: boolean;
    modulos_permitidos: ModuloSistema[];
}
