import {
  describe,
  expect,
  it,
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
    expect(dinheiro('1234,56')).toBe('1.234,56');
    expect(dinheiro('1234')).toBe('1.234,00');
    expect(dinheiro('1234,00')).toBe('1.234,00');
  });

  it('deve formatar um número sem decimais quando `semDecimais` é true', () => {
    expect(dinheiro(1234.56, { semDecimais: true })).toBe('1.235');
  });

  it('deve formatar um número com notação compacta quando `compactado` é true', () => {
    expect(dinheiro(123456789, { semDecimais: false, compactado: true })).toBe('123,457 milhões');
  });

  it('deve formatar um número com notação compacta e sem decimais quando `compactado` é true', () => {
    expect(dinheiro(123456789, { semDecimais: true, compactado: true })).toBe('123 milhões');
  });

  it('deve formatar um número com localidade específica', () => {
    expect(dinheiro(1234.56, { localidade: 'en-US' })).toBe('1,234.56');
    expect(dinheiro(1234.56, { localidade: 'fr-FR' })).toBe('1 234,56');
    expect(dinheiro(1234.56, { localidade: 'ar-EG' })).toBe('١٬٢٣٤٫٥٦');
  });

  it('deve sobrescrever minimumFractionDigits e maximumFractionDigits para 0 quando semDecimais é true, mesmo se o usuário fornecer outros valores', () => {
    expect(
      dinheiro(1234.56, { semDecimais: true, minimumFractionDigits: 5, maximumFractionDigits: 5 }),
    ).toBe('1.235');
    expect(
      dinheiro(1234.99, { semDecimais: true, minimumFractionDigits: 2, maximumFractionDigits: 4 }),
    ).toBe('1.235');
    expect(
      dinheiro(1234, { semDecimais: true, minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    ).toBe('1.234');
  });

  it('deve definir minimumFractionDigits como 2 quando semDecimais é false, e permitir maximumFractionDigits customizado', () => {
    expect(
      dinheiro(1234.5, { semDecimais: false }),
    ).toBe('1.234,50');
    expect(
      dinheiro(1234.5678, { semDecimais: false, maximumFractionDigits: 4 }),
    ).toBe('1.234,5678');
    expect(
      dinheiro(1234.5, { semDecimais: false, maximumFractionDigits: 2 }),
    ).toBe('1.234,50');
    expect(
      dinheiro(1234, { semDecimais: false, maximumFractionDigits: 2 }),
    ).toBe('1.234,00');
  });

  it('deve lidar corretamente com números negativos', () => {
    expect(dinheiro(-1234.56)).toBe('-1.234,56');
    expect(dinheiro(-1234.56, { semDecimais: true })).toBe('-1.235');
    expect(dinheiro(-0.99)).toBe('-0,99');
    expect(dinheiro(-0.99, { semDecimais: true })).toBe('-1');
  });

  it('deve lidar corretamente com zero', () => {
    expect(dinheiro(0)).toBe('0,00');
    expect(dinheiro(0, { semDecimais: true })).toBe('0');
    expect(dinheiro('0.00')).toBe('0,00');
    expect(dinheiro('0.00', { semDecimais: true })).toBe('0');
  });

  it('deve lidar corretamente com grandes números e arredondamento', () => {
    expect(dinheiro(9999999.999)).toBe('10.000.000,00');
    expect(dinheiro(9999999.99)).toBe('9.999.999,99');
    expect(dinheiro(9999999.999, { semDecimais: true })).toBe('10.000.000');
    expect(dinheiro(1000000000.1234, { maximumFractionDigits: 3 })).toBe('1.000.000.000,123');
    expect(dinheiro(1000000000.1234, { semDecimais: true })).toBe('1.000.000.000');
  });

  it('deve lidar com diferentes casas decimais de entrada', () => {
    expect(dinheiro(1234.1)).toBe('1.234,10');
    expect(dinheiro(1234.12)).toBe('1.234,12');
    expect(dinheiro(1234.123)).toBe('1.234,12');
    expect(dinheiro(1234.129)).toBe('1.234,13');
    expect(dinheiro(1234.1, { semDecimais: true })).toBe('1.234');
    expect(dinheiro(1234.9, { semDecimais: true })).toBe('1.235');
  });

  it('deve permitir maximumFractionDigits menor que minimumFractionDigits (Intl ajusta para minimum)', () => {
    expect(dinheiro(1234.567, { minimumFractionDigits: 3, maximumFractionDigits: 1 })).toBe('1.234,567');
    expect(dinheiro(1234.5, { minimumFractionDigits: 3, maximumFractionDigits: 1 })).toBe('1.234,500');
  });
});
