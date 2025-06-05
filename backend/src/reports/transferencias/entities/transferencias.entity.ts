import { IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { TipoRelatorioTransferencia } from '../dto/create-transferencias.dto';
import { IsDateYMD } from '../../../auth/decorators/date.decorator';

export class RelTransferenciasDto {
    id: number;
    identificador: string;
    ano: number | null;
    objeto: string;
    detalhamento: string; // Changed from string | null
    clausula_suspensiva: string;
    @IsDateYMD({ nullable: true }) // Decorator kept as is, type changed
    clausula_suspensiva_vencimento: string; // Changed from string | null
    normativa: string; // Changed from string | null
    observacoes: string; // Changed from string | null
    programa: string; // Changed from string | null
    empenho: string; // Changed from string | null
    pendente_preenchimento_valores: string;
    valor: number | null;
    valor_total: number | null;
    valor_contrapartida: number | null;
    emenda: string; // Changed from string | null
    dotacao: string; // Changed from string | null
    demanda: string; // Changed from string | null
    banco_fim: string; // Changed from string | null
    conta_fim: string; // Changed from string | null
    agencia_fim: string; // Changed from string | null
    banco_aceite: string; // Changed from string | null
    conta_aceite: string; // Changed from string | null
    nome_programa: string; // Changed from string | null
    agencia_aceite: string; // Changed from string | null
    emenda_unitaria: string; // Changed from string | null
    gestor_contrato: string; // Changed from string | null
    ordenador_despesa: string; // Changed from string | null
    numero_identificacao: string; // Changed from string | null
    secretaria_concedente: string; // Changed from string | null
    interface: string;
    esfera: string;
    cargo: string; // Changed from string | null
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
        empenho: string; // Changed from string | null
        programa_orcamentario_estadual: string; // Changed from string | null
        programa_orcamentario_municipal: string; // Changed from string | null
        dotacao: string; // Changed from string | null
        proposta: string; // Changed from string | null
        contrato: string; // Changed from string | null
        convenio: string; // Changed from string | null
        assinatura_termo_aceite: string; // Changed from string | null
        assinatura_municipio: string; // Changed from string | null
        assinatura_estado: string; // Changed from string | null
        vigencia: string; // Changed from string | null
        conclusao_suspensiva: string; // Changed from string | null
        registro_sei: string; // Changed from string | null
        nome_responsavel: string; // Changed from string | null
        status_nome_base: string; // Changed from string | null, non-optional
        pct_custeio: string; // Changed from string | null, non-optional
        pct_investimento: string; // Changed from string | null, non-optional
        conta: string;
        banco: string;
        agencia: string;
        gestor_conta: string;
    } | null;
    tipo_transferencia: string;
    classificacao: string; // Changed from string | null
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
