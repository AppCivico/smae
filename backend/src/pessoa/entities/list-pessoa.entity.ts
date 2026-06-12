import { IdSigla } from '../../common/dto/IdSigla.dto';

export class ListPessoa {
    id: number;
    email: string;
    nome_exibicao: string;
    nome_completo: string;
    lotacao?: string | null;

    desativado: boolean;

    atualizado_em: Date;
    desativado_em?: Date | undefined;

    orgao_id?: number | null;
    orgao: IdSigla;
    perfil_acesso_ids: number[];
    /**
     * Coluna virtual (não persistida): verdadeiro quando a pessoa possui o privilégio SMAE.sysadmin.
     * O perfil de SYSADMIN é ocultado da listagem de perfis, então esta flag permite identificá-lo
     * (ex.: visão de debug no frontend).
     */
    is_sysadmin: boolean;
    desativado_motivo?: string | null;
    cargo?: string | null;
    registro_funcionario?: string | null;
    cpf?: string | null;
}
