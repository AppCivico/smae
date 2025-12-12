import type { ListSeriesAgrupadas, VariavelResumo } from '@back/variavel/dto/list-variavel.dto';
import { SerieFilhas } from '@back/variavel/entities/variavel.entity';
import type { ComputedRef, MaybeRef } from 'vue';
import { computed, toValue } from 'vue';

type SeriesPorTipo = {
  [key: string]: Array<{
    variavel?: VariavelResumo;
    referencia: string;
    valor: number | string;
  }>;
};

export function useSeriesFilhasAgrupadasParaEdicao(
  seriesAgrupadas: MaybeRef<ListSeriesAgrupadas | null | undefined>,
): {
    seriesFilhas: ComputedRef<SeriesPorTipo>;
  } {
  const seriesFilhas = computed(() => {
    const data = toValue(seriesAgrupadas);

    const base: SeriesPorTipo = data?.ordem_series.reduce((acc, cur) => {
      if (!acc[cur]) {
        acc[cur] = [];
      }
      return acc;
    }, {}) || {};

    const filhasPorId = data?.variavel_filhas?.reduce((acc, cur) => {
      acc[cur.id] = cur;
      return acc;
    }, {} as Record<number, VariavelResumo>) || {};

    function processVariavelFilha(
      vf: SerieFilhas,
      ordemSeries: string[],
      acc: SeriesPorTipo,
    ) {
      vf.series.forEach((serie, j: number) => {
        const valorNominal = 'valor_nominal' in serie
          && serie.valor_nominal !== ''
          ? Number(serie.valor_nominal)
          : NaN;

        const seriesKey = ordemSeries[j];

        if (seriesKey && acc[seriesKey]) {
          acc[seriesKey].push({
            variavel: filhasPorId?.[vf.variavel_id],
            referencia: 'referencia' in serie ? String(serie.referencia) : '',
            valor: Number.isFinite(valorNominal) ? valorNominal : '',
          });
        }
      });
    }

    return Array.isArray(data?.linhas)
      ? data.linhas.reduce((acc, cur) => {
        cur.variaveis_filhas?.forEach((vf) => processVariavelFilha(vf, data.ordem_series, acc));

        return acc;
      }, base)
      : base;
  });

  return {
    seriesFilhas,
  };
}
