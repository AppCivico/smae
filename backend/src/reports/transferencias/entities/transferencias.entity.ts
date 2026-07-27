import { IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { TipoRelatorioTransferencia } from '../dto/create-transferencias.dto';
import { IsDateYMD } from '../../../auth/decorators/date.decorator';

// Os campos textuais voltaram a ser anuláveis: a extração agora emite o valor cru do banco
// (`null` quando ausente), sem `''` nem o hack `="valor"` — a apresentação é responsabilidade
// da etapa de pós-processamento.
export class RelTransferenciasDto {
    id: number;
    identificador: string;
    ano: number | null;
    objeto: string | null;
    detalhamento: string | null;
    clausula_suspensiva: string | null;
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
    plano_de_acao: string | null;
    secretaria_concedente: string | null;
    interface: string;
    esfera: string;
    orgao_concedente: IdSiglaDescricao;

    distribuicao_recurso: {
        id: number;
        transferencia_id: number;
        orgao_gestor_id: number;
        orgao_gestor_descricao: string | null;
        objeto: string | null;
        valor: number | null;
        valor_total: number | null;
        valor_contrapartida: number | null;
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
        status_nome_base: string | null;
        // Percentuais crus (número), formatados apenas na apresentação.
        pct_custeio: number | null;
        pct_investimento: number | null;
        conta: string | null;
        banco: string | null;
        agencia: string | null;
        gestor_conta: string | null;
    } | null;
    tipo_transferencia: string | null;
    classificacao: string | null;
    parlamentares_info: string | null;
}

export class TransferenciasRelatorioDto {
    linhas: RelTransferenciasDto[];
    linhas_cronograma: RelTransferenciaCronogramaDto[];
    tipo: TipoRelatorioTransferencia;
}

export class RelTransferenciaCronogramaDto {
    transferencia_id: number;
    hierarquia: string | null;
    tarefa: string;
    inicio_planejado: string | null;
    termino_planejado: string | null;
    custo_estimado: number | null;
    duracao_planejado: number | null;
}
