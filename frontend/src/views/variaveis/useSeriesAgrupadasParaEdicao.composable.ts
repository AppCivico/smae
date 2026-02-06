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

    const seriesPorTipo: SeriesPorTipo = data?.ordem_series?.reduce<SeriesPorTipo>((acc, cur) => {
      if (!acc[cur]) {
        acc[cur] = [];
      }
      return acc;
    }, {} as SeriesPorTipo) || {};

    const filhasPorId = data?.variavel_filhas?.reduce((acc, cur) => {
      acc[cur.id] = cur;
      return acc;
    }, {} as Record<number, VariavelResumo>) || {};

    if (Array.isArray(data?.linhas)) {
      data.linhas.forEach((linha) => {
        linha
          .variaveis_filhas?.forEach((vf) => {
            // Contrato: vf.series.length deve ser igual a data.ordem_series.length
            // O backend garante este alinhamento em metas.service.ts
            if (import.meta.env.DEV && vf.series.length !== data.ordem_series.length) {
              // eslint-disable-next-line no-console
              console.warn(
                `Incompatibilidade no tamanho de séries para variável ${vf.variavel_id}: `
                + `esperado ${data.ordem_series.length}, recebido ${vf.series.length}`,
              );
            }

            vf.series.forEach((serie, i) => {
              const valorNominal = 'valor_nominal' in serie && serie.valor_nominal !== ''
                ? Number(serie.valor_nominal)
                : NaN;

              const tipo = data.ordem_series[i];

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
