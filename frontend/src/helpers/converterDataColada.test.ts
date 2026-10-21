import {
  describe,
  expect,
  it,
} from 'vitest';
import converterDataColada from './converterDataColada';

describe('converterDataColada', () => {
  it.each([
    ['15/03/2025', '2025-03-15'],
    ['5/3/2025', '2025-03-05'],
    ['15-03-2025', '2025-03-15'],
    ['15.03.2025', '2025-03-15'],
    ['  15/03/2025  ', '2025-03-15'],
    ['2025-03-15', '2025-03-15'],
  ])('converte "%s" para %s', (texto, esperado) => {
    expect(converterDataColada(texto)).toBe(esperado);
  });

  it('lê dia antes do mês, no padrão brasileiro', () => {
    expect(converterDataColada('01/02/2025')).toBe('2025-02-01');
  });

  it('interpreta anos com dois dígitos perto do ano atual', () => {
    expect(converterDataColada('15/03/25')).toBe('2025-03-15');
    expect(converterDataColada('15/03/80')).toBe('1980-03-15');
  });

  it('descarta o horário', () => {
    expect(converterDataColada('15/03/2025 14:30')).toBe('2025-03-15');
    expect(converterDataColada('2025-03-15T10:00:00Z')).toBe('2025-03-15');
  });

  it.each([
    '31/02/2025',
    '15/13/2025',
    '03/2025',
    'abc',
    '',
    '15/03/202',
    '15/03/20255',
    '1/1/202',
  ])('ignora "%s"', (texto) => {
    expect(converterDataColada(texto)).toBeNull();
  });
});
