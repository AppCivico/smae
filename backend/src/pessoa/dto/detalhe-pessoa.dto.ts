import { IdNomeDto } from '../../common/dto/IdNome.dto';

export class ProjetosResponsavelDto {
    id: number;
    codigo: string | null;
    nome: string;
}

export class DetalhePessoaDto {
    atualizado_em?: Date;
    desativado: boolean;
    desativado_em?: Date;
    desativado_motivo?: string | null;
    id: number;
    email: string;
    nome_exibicao: string;
    nome_completo: string;
    lotacao: string | null;
    cargo: string | null;
    registro_funcionario: string | null;
    cpf: string | null;
    equipes: number[];
    grupos: IdNomeDto[];

    orgao_id?: number | undefined;
    perfil_acesso_ids: number[];
    responsavel_pelos_projetos: ProjetosResponsavelDto[];
}
