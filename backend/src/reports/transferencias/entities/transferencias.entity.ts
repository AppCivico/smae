import { IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';

export class RelTransferenciasDto {
    id: number;
    identificador: string;
    ano: number | null;
    objeto: string;
    detalhamento: string | null;
    critico: boolean;
    clausula_suspensiva: boolean;
    clausula_suspensiva_vencimento: Date | null;
    normativa: string | null;
    observacoes: string | null;
    programa: string | null;
    empenho: boolean | null;
    pendente_preenchimento_valores: boolean;
    valor: number | null;
    valor_total: number | null;
    valor_contrapartida: number | null;
    emenda: string | null;
    dotacao: string | null;
    demanda: string | null;
    banco_fim: string | null;
    conta_fim: string | null;
    agencia_fim: string | null;
    banco_aceite: string | null;
    conta_aceite: string | null;
    nome_programa: string | null;
    agencia_aceite: string | null;
    emenda_unitaria: string | null;
    gestor_contrato: string | null;
    ordenador_despesa: string | null;
    numero_identificacao: string | null;
    secretaria_concedente: string | null;
    interface: string;
    esfera: string;
    cargo: string | null;
    orgao_concedente: IdSiglaDescricao;
    partido: {
        id: number | null;
        sigla: string | null;
    } | null;
    parlamentar: {
        id: number | null;
        nome: string | null;
        nome_popular: string | null;
    } | null;
}

export class TransferenciasRelatorioDto {
    linhas: RelTransferenciasDto[];
}
