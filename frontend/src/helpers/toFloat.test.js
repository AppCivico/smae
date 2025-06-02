import {
  describe,
  expect,
  it,
} from 'vitest';
import toFloat from './toFloat';

describe('toFloat', () => {
  it('deve converter uma string numérica com vírgula para float', () => {
    expect(toFloat('1234,56')).toBe(1234.56);
  });

  it('deve converter uma string numérica com ponto para float', () => {
    expect(toFloat('1234.56')).toBe(1234.56);
  });

  it('deve converter um número inteiro para float', () => {
    expect(toFloat(1234)).toBe(1234);
  });

  it('deve retornar NaN para entradas inválidas', () => {
    expect(toFloat('abc')).toBeNaN();
    expect(toFloat(undefined)).toBeNaN();
    expect(toFloat(null)).toBeNaN();
  });

  it('deve remover caracteres não numéricos e converter corretamente', () => {
    expect(toFloat('R$ 1.234,56')).toBe(1234.56);
  });

  it('deve lidar com números negativos', () => {
    expect(toFloat('-1234,56')).toBe(-1234.56);
    expect(toFloat('-1234.56')).toBe(-1234.56);
  });

  it('deve retornar o valor original se já for um número', () => {
    expect(toFloat(1234.56)).toBe(1234.56);
    expect(toFloat(0)).toBe(0);
  });
});
