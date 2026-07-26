import { DemandaFinalidade, DemandaStatus } from '@prisma/client';

export class RelDemandasDto {
    id: number;
    status: DemandaStatus;
    /** Data em ISO (`YYYY-MM-DD`); a apresentação `dd/mm/aaaa` é do pós-processamento. */
    data_registro: string | null;
    data_publicado: string | null;
    orgao_gestor: string | null;
    unidade_responsavel: string | null;
    nome_responsavel: string | null;
    cargo_responsavel: string | null;
    email_responsavel: string | null;
    telefone_responsavel: string | null;
    nome_projeto: string | null;
    descricao: string | null;
    justificativa: string | null;
    /**
     * String decimal (ex.: `1500.00`), vinda de `numeric::text` no SQL: preserva a precisão
     * do `Decimal` do Prisma, que `toNumber()` perderia ao passar por double.
     */
    valor: string | null;
    finalidade: DemandaFinalidade;
    observacao: string | null;
    area_tematica: string | null;
    acoes: string | null;
}

export class RelDemandasEnderecosDto {
    demanda_id: number;
    nome_projeto: string | null;
    cep: string | null;
    endereco: string | null;
    bairro: string | null;
    subprefeitura: string | null;
    distrito: string | null;
}

export class DemandasRelatorioDto {
    linhas: RelDemandasDto[];
    enderecos: RelDemandasEnderecosDto[];
}
