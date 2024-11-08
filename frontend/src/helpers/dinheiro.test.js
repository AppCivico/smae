import {
  describe,
  it,
  expect,
} from 'vitest';
import dinheiro from './dinheiro';

describe('dinheiro', () => {
  it('deve retornar uma string vazia para entradas inválidas', () => {
    expect(dinheiro('abc')).toBe('');
    expect(dinheiro(undefined)).toBe('');
    expect(dinheiro(null)).toBe('');
    expect(dinheiro(NaN)).toBe('');
  });

  it('deve formatar um número com decimais corretamente', () => {
    expect(dinheiro(1234.56)).toBe('1.234,56');
  });

  it('deve formatar corretamente um valor de string numérica', () => {
    expect(dinheiro('1234.56')).toBe('1.234,56');
  });

  it('deve formatar um número sem decimais quando `semDecimais` é true', () => {
    expect(dinheiro(1234.56, true)).toBe('1.235');
  });

  it('deve formatar um número com notação compacta quando `compactado` é true', () => {
    expect(dinheiro(123456789, false, true)).toBe('123,457 milhões');
  });

  it('deve formatar um número com notação compacta e sem decimais quando `compactado` é true', () => {
    expect(dinheiro(123456789, true, true)).toBe('123 milhões');
  });
});
