import { ListIndicadoresDto } from "../../indicadores/entities/indicadores.entity";

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
}

export class RelPsMonitRetorno extends ListIndicadoresDto{
    monitoramento: RelPsMonitoramentoMensalVariaveis[];
}
