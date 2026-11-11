import { mount } from '@vue/test-utils';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { h } from 'vue';

import calcularResumoFontesDeRecurso from '@/helpers/calcularResumoFontesDeRecurso';

import RodapeFontesDeRecurso from './RodapeFontesDeRecurso.vue';

const montar = (props: InstanceType<typeof RodapeFontesDeRecurso>['$props']) => mount({
  render: () => h('table', [h('tfoot', [h(RodapeFontesDeRecurso, props)])]),
});

const textoDasLinhas = (envelope: ReturnType<typeof montar>) => envelope
  .findAll('tr')
  .map((linha) => linha.findAll('th, td').map((celula) => celula.text()));

describe('RodapeFontesDeRecurso', () => {
  it('exibe apenas as linhas de sem informação e total', () => {
    const envelope = montar({
      resumo: calcularResumoFontesDeRecurso([250, 500], 1000),
      colspanDoTitulo: 3,
    });

    expect(textoDasLinhas(envelope)).toEqual([
      ['Sem informação', 'R$ 250,00', '25,00%'],
      ['Total', 'R$ 1.000,00', '100,00%'],
    ]);
    expect(envelope.text()).not.toContain('Fontes informadas');
  });

  it('alinha os valores às colunas de valor e percentual da tabela', () => {
    const envelope = montar({
      resumo: calcularResumoFontesDeRecurso([250], 1000),
      colspanDoTitulo: 3,
      colspanFinal: 2,
    });

    envelope.findAll('tr').forEach((linha) => {
      const celulas = linha.findAll('th, td');
      expect(celulas[0].attributes('colspan')).toBe('3');
      expect(celulas[celulas.length - 1].attributes('colspan')).toBe('2');
    });
  });

  it('destaca o excedente quando as fontes superam o custo planejado', () => {
    const envelope = montar({
      resumo: calcularResumoFontesDeRecurso([1500], 1000),
      colspanDoTitulo: 3,
    });

    const linhaSemInformacao = envelope.findAll('tr')[0];

    expect(linhaSemInformacao.classes()).toContain('tvermelho');
    expect(linhaSemInformacao.text()).toContain('Recurso excede o total do cronograma');
    expect(linhaSemInformacao.text()).toContain('R$ -500,00');
  });

  it('exibe apenas o total informado quando não há custo planejado', () => {
    const envelope = montar({
      resumo: calcularResumoFontesDeRecurso([100, 200], null),
      colspanDoTitulo: 3,
    });

    expect(textoDasLinhas(envelope)).toEqual([
      ['Sem informação', '—', '—'],
      ['Total', 'R$ 300,00', '—'],
    ]);
  });
});
