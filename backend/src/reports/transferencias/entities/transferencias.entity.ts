import { IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { TipoRelatorioTransferencia } from '../dto/create-transferencias.dto';
import { IsDateYMD } from '../../../auth/decorators/date.decorator';

export class RelTransferenciasDto {
    id: number;
    identificador: string;
    ano: number | null;
    objeto: string;
    detalhamento: string | null;
    clausula_suspensiva: string;
    @IsDateYMD({ nullable: true })
    clausula_suspensiva_vencimento: string | null;
    normativa: string | null;
    observacoes: string | null;
    programa: string | null;
    empenho: string | null;
    pendente_preenchimento_valores: string;
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
        orgao_gestor_descricao: string;
        objeto: string;
        valor: number;
        valor_total: number;
        valor_contrapartida: number;
        empenho: string | null;
        programa_orcamentario_estadual: string | null;
        programa_orcamentario_municipal: string | null;
        dotacao: string | null;
        proposta: string | null;
        contrato: string | null;
        convenio: string | null;
        assinatura_termo_aceite: string | null;
        assinatura_municipio: string | null;
        assinatura_estado: string | null;
        vigencia: string | null;
        conclusao_suspensiva: string | null;
        registro_sei: string | null;
        nome_responsavel: string | null;
        status_nome_base?: string | null;
        pct_custeio?: string | null;
        pct_investimento?: string | null;
    } | null;
    tipo_transferencia: string;
    classificacao: string | null;
}

export class TransferenciasRelatorioDto {
    linhas: RelTransferenciasDto[];
    linhas_cronograma: RelTransferenciaCronogramaDto[];
    tipo: TipoRelatorioTransferencia;
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
