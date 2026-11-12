import { IsDateYMD } from '../../../auth/decorators/date.decorator';
import { DateYMD } from '../../../common/date2ymd';
import { MonitoramentoFaseLeituraDto } from '../../../pdm-ciclo/entities/ps-ciclo-fase.entity';
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
    data_referencia: string;
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
    meta_id: number;
    meta_codigo: string;
    meta_titulo: string;
    ciclo_fisico_id: number;
    @IsDateYMD()
    data_ciclo: DateYMD;
    ciclo_fechado: boolean;
    ciclo_reaberto: boolean;
    /**
     * Fases habilitadas do plano, em ordem; vazio quando o plano não monitora por fases
     */
    fases: MonitoramentoFaseLeituraDto[];
}

export class RelPsMonitRetorno extends ListIndicadoresDto {
    monitoramento: RelPsMonitoramentoMensalVariaveis[];
    ciclo_metas: RelPSMonitoramentoMensalCicloMetasDto[];
}
