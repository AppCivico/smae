import { ModuloSistema } from '@prisma/client';
import { IdNomeDto } from '../../common/dto/IdNome.dto';
import { MaxLength } from 'class-validator';

export class ProjetosResponsavelDto {
    id: number;
    @MaxLength(255, { message: 'O campo "Código" deve ter no máximo 255 caracteres' })
    codigo: string | null;

    @MaxLength(255, { message: 'O campo "Nome" deve ter no máximo 255 caracteres' })
    nome: string;
}

export class PessoaMetaPermissoesDto {
    posso_editar_modulos: boolean;
}

export class DetalhePessoaDto {
    atualizado_em?: Date;
    desativado: boolean;
    desativado_em?: Date;
    desativado_motivo?: string | null;
    id: number;
    email: string;

    @MaxLength(255, { message: 'O campo "Nome exibição" deve ter no máximo 255 caracteres' })
    nome_exibicao: string;

    @MaxLength(255, { message: 'O campo "Nome completo" deve ter no máximo 255 caracteres' })
    nome_completo: string;

    @MaxLength(255, { message: 'O campo "Lotação" deve ter no máximo 255 caracteres' })
    lotacao: string | null;

    @MaxLength(255, { message: 'O campo "Cargo" deve ter no máximo 255 caracteres' })
    cargo: string | null;

    @MaxLength(255, { message: 'O campo "Registro funcionário" deve ter no máximo 255 caracteres' })
    registro_funcionario: string | null;

    cpf: string | null;
    equipes: number[];
    grupos: IdNomeDto[];

    orgao_id?: number | undefined;
    perfil_acesso_ids: number[];
    responsavel_pelos_projetos: ProjetosResponsavelDto[];

    sobreescrever_modulos: boolean;
    modulos_permitidos: ModuloSistema[];

    permissoes: PessoaMetaPermissoesDto;
}
