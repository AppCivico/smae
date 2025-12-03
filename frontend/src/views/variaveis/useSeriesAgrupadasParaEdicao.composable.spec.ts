import type { ListSeriesAgrupadas } from '@back/variavel/dto/list-variavel.dto';
import { describe, expect, it } from 'vitest';
import { useSeriesFilhasAgrupadasParaEdicao } from './useSeriesAgrupadasParaEdicao.composable';

describe('useSeriesFilhasAgrupadasParaEdicao', () => {
  it('deve processar dados de séries e agrupar por tipo', () => {
    const testValue: ListSeriesAgrupadas = {
      dados_auxiliares: {
        categoricas: {
          1: 'muito ruim',
          2: 'ruim',
          3: 'satisfatório',
          4: 'bom',
          5: 'muito bom',
        },
      },
      linhas: [
        {
          agrupador: '2025',
          periodo: '2025-06',
          series: [
            {
              data_valor: '2025-06-01',
              elementos: null,
              referencia: 'P_1K9060100043T_______00000GF0EGVJ9',
              valor_nominal: '',
            },
            {
              data_valor: '2025-06-01',
              elementos: null,
              referencia: 'PA1K9060100043T_______00000GFVZOYND',
              valor_nominal: '',
            },
          ],
          variaveis_filhas: [
            {
              series: [
                {
                  conferida: true,
                  data_valor: '2025-06-01',
                  elementos: [
                    {
                      categoria: '5',
                      variavel_id: 5326,
                    },
                  ],
                  referencia: 'P_1K9060100043Y0069VDR00000GF4OPRFW',
                  valor_nominal: '5',
                },
                {
                  conferida: true,
                  data_valor: '2025-06-01',
                  elementos: null,
                  referencia: 'PA1K9060100043Y0069VLB00000GFPAWIGA',
                  valor_nominal: '5',
                },
              ],
              variavel_id: 5326,
            },
          ],
        },
      ],
      ordem_series: [
        'Previsto',
        'PrevistoAcumulado',
      ],
      variavel: {
        acumulativa: false,
        casas_decimais: 0,
        codigo: 'QUALI.06.00716/2024',
        id: 5321,
        periodicidade: 'Semestral',
        recalculando: true,
        recalculo_erro: null,
        recalculo_tempo: null,
        suspendida: false,
        titulo: 'qualidade do atendimento de suporte a hardware',
        unidade_medida: {
          descricao: 'Sem unidade de medida',
          id: -1,
          sigla: '',
        },
        valor_base: '0',
        variavel_categorica_id: 5,
        variavel_mae_id: null,
      },
      variavel_filhas: [
        {
          acumulativa: false,
          casas_decimais: 0,
          codigo: 'QUALI.06.00716/2024.Centro',
          id: 5326,
          periodicidade: 'Semestral',
          recalculando: false,
          recalculo_erro: null,
          recalculo_tempo: null,
          suspendida: false,
          titulo: 'qualidade do atendimento de suporte a hardware - Centro',
          unidade_medida: {
            descricao: 'Sem unidade de medida',
            id: -1,
            sigla: '',
          },
          valor_base: '0',
          variavel_categorica_id: 5,
          variavel_mae_id: 5321,
        },
      ],
    };
    const { seriesFilhas } = useSeriesFilhasAgrupadasParaEdicao(testValue);

    const expectedResult = {
      Previsto: [
        {
          variavel: {
            acumulativa: false,
            casas_decimais: 0,
            codigo: 'QUALI.06.00716/2024.Centro',
            id: 5326,
            periodicidade: 'Semestral',
            recalculando: false,
            recalculo_erro: null,
            recalculo_tempo: null,
            suspendida: false,
            titulo: 'qualidade do atendimento de suporte a hardware - Centro',
            unidade_medida: {
              descricao: 'Sem unidade de medida',
              id: -1,
              sigla: '',
            },
            valor_base: '0',
            variavel_categorica_id: 5,
            variavel_mae_id: 5321,
          },
          referencia: 'P_1K9060100043Y0069VDR00000GF4OPRFW',
          valor: 5,
        },
      ],
      PrevistoAcumulado: [
        {
          variavel: {
            acumulativa: false,
            casas_decimais: 0,
            codigo: 'QUALI.06.00716/2024.Centro',
            id: 5326,
            periodicidade: 'Semestral',
            recalculando: false,
            recalculo_erro: null,
            recalculo_tempo: null,
            suspendida: false,
            titulo: 'qualidade do atendimento de suporte a hardware - Centro',
            unidade_medida: {
              descricao: 'Sem unidade de medida',
              id: -1,
              sigla: '',
            },
            valor_base: '0',
            variavel_categorica_id: 5,
            variavel_mae_id: 5321,
          },
          referencia: 'PA1K9060100043Y0069VLB00000GFPAWIGA',
          valor: 5,
        },
      ],
    };

    expect(seriesFilhas.value).toEqual(expectedResult);
  });
});
