import type { ListSeriesAgrupadas, VariavelResumo } from '@back/variavel/dto/list-variavel.dto';
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

    const seriesPorTipo: SeriesPorTipo = data?.ordem_series.reduce((acc, cur) => {
      if (!acc[cur]) {
        acc[cur] = [];
      }
      return acc;
    }, {}) || {};

    const filhasPorId = data?.variavel_filhas?.reduce((acc, cur) => {
      acc[cur.id] = cur;
      return acc;
    }, {} as Record<number, VariavelResumo>) || {};

    if (Array.isArray(data?.linhas)) {
      data.linhas.forEach((linha) => {
        linha
          .variaveis_filhas?.forEach((vf) => {
            vf.series.forEach((serie, j: number) => {
              const valorNominal = 'valor_nominal' in serie && serie.valor_nominal !== ''
                ? Number(serie.valor_nominal)
                : NaN;

              const tipo = data.ordem_series[j];

              if (tipo && seriesPorTipo[tipo]) {
                seriesPorTipo[tipo].push({
                  variavel: filhasPorId?.[vf.variavel_id],
                  referencia: 'referencia' in serie ? String(serie.referencia) : '',
                  valor: Number.isFinite(valorNominal) ? valorNominal : '',
                });
              }
            });
          });
      });
    }

    return seriesPorTipo;
  });

  return {
    seriesFilhas,
  };
}
