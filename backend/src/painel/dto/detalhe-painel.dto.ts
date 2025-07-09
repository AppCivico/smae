import { Periodicidade, Periodo, Prisma, Serie } from 'src/generated/prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class DetailPainelVisualizacaoDto {
    id: number;
    periodicidade: Periodicidade;
    periodo: Periodo | null;
    periodo_valor: number | null;
    periodo_inicio: Date | null;
    periodo_fim: Date | null;
    mostrar_acumulado: boolean;
    mostrar_planejado: boolean;
    ordem: number | null;
}

export class PainelConteudoSerieDto {
    id: number;
    meta_id: number;
}

export class SimplifiedPainelConteudoSeries {
    indicador_id?: number | null;
    indicador_titulo?: string | null;
    indicador_codigo?: string | null;

    variavel_id?: number | null;
    variavel_codigo?: string | null;
    variavel_titulo?: string | null;

    meta_id: number;
    meta_codigo: string;
    meta_titulo: string;

    iniciativa_id?: number | null;
    iniciativa_codigo?: string | null;
    iniciativa_titulo?: string | null;

    atividade_id?: number | null;
    atividade_codigo?: string | null;
    atividade_titulo?: string | null;

    series: SimplifiedSeries[] | undefined;
}

export class SimplifiedSeries {
    data: string;
    Previsto?: number | null;
    PrevistoAcumulado?: number | null;
    Realizado?: number | null;
    RealizadoAcumulado?: number | null;
}

export class PainelConteudoSerie {
    mostrar_acumulado: boolean;
    mostrar_acumulado_periodo: boolean;
    mostrar_indicador: boolean;
    mostrar_planejado: boolean;
    meta: PainelConteudoMetaSerie;
    detalhes: PainelConteudoDetalhesSeries[] | null;

    /**
     * contextualiza qual a ordem que as séries serão apresentadas dentro da array Series
     * @example "["Previsto", "PrevistoAcumulado", "Realizado", "RealizadoAcumulado"]"
     */
    ordem_series: string[];
}

export class PainelConteudoMetaSerie {
    id: number;
    titulo: string;
    codigo: string;
    indicador?: RowWithIdTitleSeries | null;
}
export class PainelConteudoDetalhesSeries {
    variavel: RowWithIdTitleSeries | null;
    iniciativa: RowWithIdTitleSeries | null;
    filhos: FirstLevelChildren[] | null;
}

export class RowWithIdTitleSeries {
    id?: number | null;
    titulo?: string | null;
    indicador?: RowWithIdTitleSeries[] | null;
    codigo?: string | null;
    series?: SeriesTemplate[] | null;
}

export class IniciativaIndicadorRow {}

export class FirstLevelChildren {
    variavel: RowWithIdTitleSeries | null;
    atividade: RowWithIdTitleSeries | null;
    filhos: SecondLevelChildren[] | null;
}

export class SecondLevelChildren {
    variavel: RowWithIdTitleSeries | null;
}
export class SeriesTemplate {
    titulo: string;
    periodo_inicio: Date;
    periodo_fim: Date;

    /**
     *
     * @example "["", 123.456, 0, 1]"
     */
    valores_nominais: (number | Decimal | '')[];
}

export class SerieRow {
    serie: Serie;
    data_valor: Date;
    valor_nominal: number | Prisma.Decimal;
}
