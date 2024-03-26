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

    distribuicao_recurso: {
        id: number;
        transferencia_id: number;
        orgao_gestor_id: number;
        objeto: string;
        valor: number;
        valor_total: number;
        valor_contrapartida: number;
        empenho: boolean;
        programa_orcamentario_estadual: string | null;
        programa_orcamentario_municipal: string | null;
        dotacao: string | null;
        proposta: string | null;
        contrato: string | null;
        convenio: string | null;
        assinatura_termo_aceite: Date | null;
        assinatura_municipio: Date | null;
        assinatura_estado: Date | null;
        vigencia: Date | null;
        conclusao_suspensiva: Date | null;
        registro_sei: string | null;
    } | null;
}

export class TransferenciasRelatorioDto {
    linhas: RelTransferenciasDto[];
    linhas_cronograma: RelTransferenciaCronogramaDto[];
}

export class RelTransferenciaCronogramaDto {
    transferencia_id: number;
    hirearquia: string;
    tarefa: string;
    inicio_planejado: string | null;
    termino_planejado: string | null;
    custo_estimado: number | null;
    duracao_planejado: number | null;
}
