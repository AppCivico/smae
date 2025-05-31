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

  it('deve aplicar opções adicionais de formatação', () => {
    expect(dinheiro(1234.56, { style: 'currency', currency: 'USD', maximumSignificantDigits: 3 })).toBe('US$ 1.230');
    expect(dinheiro(1234.56, { style: 'currency', currency: 'EUR', maximumSignificantDigits: 3 })).toBe('€ 1.230');
    expect(dinheiro(1234.56, { style: 'currency', currency: 'BRL', maximumSignificantDigits: 3 })).toBe('R$ 1.230');
  });
});
