import { DemandaFinalidade, DemandaStatus } from '@prisma/client';

export class RelDemandasDto {
    id: number;
    status: DemandaStatus;
    data_registro: string;
    data_publicado: string | null;
    orgao_gestor: string;
    unidade_responsavel: string;
    nome_responsavel: string;
    cargo_responsavel: string;
    email_responsavel: string;
    telefone_responsavel: string;
    nome_projeto: string;
    descricao: string;
    justificativa: string;
    valor: number;
    finalidade: DemandaFinalidade;
    observacao: string | null;
    area_tematica: string;
    acoes: string;
}

export class RelDemandasEnderecosDto {
    demanda_id: number;
    nome_projeto: string;
    cep: string;
    endereco: string;
    bairro: string;
    subprefeitura: string;
    distrito: string;
}

export class DemandasRelatorioDto {
    linhas: RelDemandasDto[];
    enderecos: RelDemandasEnderecosDto[];
}
