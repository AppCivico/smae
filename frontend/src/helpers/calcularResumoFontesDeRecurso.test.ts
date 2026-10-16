import {
  describe,
  expect,
  it,
} from 'vitest';
import calcularResumoFontesDeRecurso from './calcularResumoFontesDeRecurso';

describe('calcularResumoFontesDeRecurso', () => {
  it('deve considerar todo o custo planejado como sem informação quando não há fontes', () => {
    expect(calcularResumoFontesDeRecurso([], 1000)).toEqual({
      percentuais: [],
      totalInformado: 0,
      percentualInformado: 0,
      semInformacao: 1000,
      percentualSemInformacao: 100,
      total: 1000,
      excedente: false,
    });
  });

  it('deve calcular o percentual de cada fonte em relação ao custo planejado', () => {
    const resumo = calcularResumoFontesDeRecurso([250, 500], 1000);

    expect(resumo.percentuais).toEqual([25, 50]);
    expect(resumo.totalInformado).toBe(750);
    expect(resumo.percentualInformado).toBe(75);
    expect(resumo.semInformacao).toBe(250);
    expect(resumo.percentualSemInformacao).toBe(25);
    expect(resumo.total).toBe(1000);
    expect(resumo.excedente).toBe(false);
  });

  it('deve zerar o saldo quando as fontes somam exatamente o custo planejado', () => {
    const resumo = calcularResumoFontesDeRecurso([0.1, 0.2], 0.3);

    expect(resumo.semInformacao).toBe(0);
    expect(resumo.excedente).toBe(false);
  });

  it('deve indicar excedente e saldo negativo quando as fontes superam o custo planejado', () => {
    const resumo = calcularResumoFontesDeRecurso([1500, 1500], 1500);

    expect(resumo.percentuais).toEqual([100, 100]);
    expect(resumo.semInformacao).toBe(-1500);
    expect(resumo.percentualSemInformacao).toBe(-100);
    expect(resumo.total).toBe(1500);
    expect(resumo.excedente).toBe(true);
  });

  it('deve arredondar os percentuais para duas casas decimais', () => {
    expect(calcularResumoFontesDeRecurso([1, 2], 3).percentuais).toEqual([33.33, 66.67]);
  });

  it('deve ignorar fontes sem valor informado', () => {
    const resumo = calcularResumoFontesDeRecurso([null, 400, undefined, ''], 1000);

    expect(resumo.percentuais).toEqual([null, 40, null, null]);
    expect(resumo.totalInformado).toBe(400);
    expect(resumo.semInformacao).toBe(600);
  });

  it('deve aceitar valores numéricos em texto', () => {
    expect(calcularResumoFontesDeRecurso(['250.5'], '1000').totalInformado).toBe(250.5);
  });

  it('não deve calcular percentuais nem saldo sem custo planejado', () => {
    [null, undefined, 0].forEach((custo) => {
      expect(calcularResumoFontesDeRecurso([100, 200], custo)).toEqual({
        percentuais: [null, null],
        totalInformado: 300,
        percentualInformado: null,
        semInformacao: null,
        percentualSemInformacao: null,
        total: 300,
        excedente: false,
      });
    });
  });
});
