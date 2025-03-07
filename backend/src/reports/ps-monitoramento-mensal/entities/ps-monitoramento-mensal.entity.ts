import { ListIndicadoresDto } from '../../indicadores/entities/indicadores.entity';

export class RelPsMonitoramentoMensalVariaveis {
    indicador_id: number;
    codigo_indicador: string;
    titulo_indicador: string;
    variavel_id: number;
    codigo_variavel: string;
    titulo_variavel: string;
    municipio_id: number | null;
    municipio: string | null;
    regiao_id: number | null;
    regiao: string | null;
    subprefeitura_id: number | null;
    subprefeitura: string | null;
    distrito_id: number | null;
    distrito: string | null;
    serie: string;
    data_referencia: Date;
    valor_categorica: string | null;
    valor_nominal: number;
    data_preenchimento: string;
    data_proximo_ciclo: string;
    analise_qualitativa_coleta: string | null;
    analise_qualitativa_aprovador: string | null;
    analise_qualitativa_liberador: string | null;
    analise_qualitativa_pessoa: string | null;
    analise_qualitativa_conferencia_pessoa: string | null;
    orgao_proprietario_id: number | null;
    orgao_proprietario_sigla: string | null;
    orgao_coleta_id: number | null;
    orgao_coleta_sigla: string | null;
}

export class RelPSMonitoramentoMensalCicloMetasDto {
    ps_id?: number;
    meta_id: number;
    meta_codigo: string;
    iniciativa_id: number | null;
    iniciativa_codigo: string | null;
    atividade_id: number | null;
    atividade_codigo: string | null;
    analise_qualitativa: string | null;
    analise_qualitativa_data: string | null;
    risco_detalhamento: string | null;
    risco_ponto_atencao: string | null;
    fechamento_comentario: string | null;
}

export class RelPsMonitRetorno extends ListIndicadoresDto {
    monitoramento: RelPsMonitoramentoMensalVariaveis[];
    ciclo_metas: RelPSMonitoramentoMensalCicloMetasDto[];
}
